import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

const Role = {
  REQUESTOR: "REQUESTOR",
  AGGREGATOR: "AGGREGATOR",
  APPROVER: "APPROVER",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;

const ReservationStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

const StageStatus = {
  REQUESTED: "REQUESTED",
  APPROVED: "APPROVED",
} as const;

// const prisma = new PrismaClient();

type UserData = {
  name: string;
  email: string;
  role: (typeof Role)[keyof typeof Role];
  org: string;
};

type RoomData = {
  name: string;
  loc: string;
  cap: number;
};

async function main() {
  console.log("Starting massive seeding...");

  // 1. Clear DB in order
  await prisma.notification.deleteMany();
  await prisma.approvalWorkflow.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.roomFacility.deleteMany();
  await prisma.facility.deleteMany();
  await prisma.room.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  // 2. Create Facilities
  const facilities = await prisma.$transaction([
    prisma.facility.create({
      data: { name: "Proyektor 4K", description: "Ultra HD projector" },
    }),
    prisma.facility.create({
      data: { name: "AC Inverter", description: "Pendingin hemat energi" },
    }),
    prisma.facility.create({
      data: { name: "Fiber Optic Internet", description: "1 Gbps dedicated" },
    }),
    prisma.facility.create({
      data: { name: "Sound System", description: "Built-in ceiling speakers" },
    }),
    prisma.facility.create({
      data: { name: "Smart Whiteboard", description: "Digital touch board" },
    }),
    prisma.facility.create({
      data: {
        name: "Video Conference",
        description: "Wide-angle camera system",
      },
    }),
  ]);

  // 3. Create Users
  const departments = [
    "Teknik Informatika",
    "Sistem Informasi",
    "Kedokteran",
    "Manajemen Bisnis",
    "Hukum",
  ];
  const usersData = [
    {
      name: "Andi Tech",
      email: "andi@univ.edu",
      role: Role.REQUESTOR,
      org: departments[0],
    },
    {
      name: "Budi Admin",
      email: "admin@univ.edu",
      role: Role.AGGREGATOR,
      org: "Sarana Prasarana",
    },
    {
      name: "Prof. Cici",
      email: "kaprodi@univ.edu",
      role: Role.APPROVER,
      org: departments[0],
    },
    {
      name: "Super User",
      email: "super@univ.edu",
      role: Role.SUPER_ADMIN,
      org: "IT Center",
    },
    {
      name: "Eka Medic",
      email: "eka@univ.edu",
      role: Role.APPROVER,
      org: departments[2],
    },
    {
      name: "Karin Tech",
      email: "karin@univ.edu",
      role: Role.APPROVER,
      org: departments[1],
    },
    {
      name: "Putra Law",
      email: "putra@univ.edu",
      role: Role.APPROVER,
      org: departments[4],
    },
    // ... tambahkan semua user lainnya
  ];

  const createdUsers = await Promise.all(
    usersData.map((u: UserData) =>
      prisma.user.create({
        data: {
          name: u.name,
          email: u.email,
          password: passwordHash,
          role: u.role,
          organization: u.org,
          phone: `0812${Math.floor(Math.random() * 100000000)}`,
        },
      }),
    ),
  );

  // 4. Filter roles
  const aggregators = createdUsers.filter((u) => u.role === Role.AGGREGATOR);
  const approvers = createdUsers.filter((u) => u.role === Role.APPROVER);
  const requesters = createdUsers.filter((u) => u.role === Role.REQUESTOR);

  // 5. Create Rooms
  const roomData = [
    { name: "Ruang Kelas 101", loc: "Gedung A, Lt.1", cap: 40 },
    { name: "Lab Jaringan", loc: "Gedung B, Lt.2", cap: 30 },
    { name: "Aula Utama", loc: "Gedung Rektorat, Lt.1", cap: 500 },
    { name: "Smart Class 402", loc: "Gedung C, Lt.4", cap: 25 },
    { name: "Lab Multimedia", loc: "Gedung B, Lt.3", cap: 30 },
    { name: "Ruang Seminar 2", loc: "Gedung E, Lt.2", cap: 60 },
    { name: "Ruang Rapat Senat", loc: "Gedung Rektorat, Lt.2", cap: 50 },
    // ... tambahkan semua room lainnya
  ];

  const createdRooms = await Promise.all(
    roomData.map((r: RoomData) => {
      const randomApprover =
        approvers[Math.floor(Math.random() * approvers.length)];
      return prisma.room.create({
        data: {
          name: r.name,
          location: r.loc,
          capacity: r.cap,
          approverId: randomApprover.id,
          facilities: {
            create: facilities
              .slice(0, Math.floor(Math.random() * 5) + 1)
              .map((f: (typeof facilities)[number]) => ({
                facilityId: f.id,
              })),
          },
        },
      });
    }),
  );

  // 6. Create Reservations + ApprovalStages + Notifications
  const purposes = [
    "Kuliah Pengganti",
    "Rapat Hima",
    "Seminar Skripsi",
    "Workshop Pemrograman",
    "Rapat Panitia",
    "Persiapan Event",
    "Praktikum Mandiri",
    "Presentasi Proyek",
  ];
  const now = new Date();

  for (let i = 0; i < 40; i++) {
    const isPast = Math.random() > 0.5;
    const daysOffset = Math.floor(Math.random() * 30) * (isPast ? -1 : 1);

    const startTime = new Date(now);
    startTime.setDate(now.getDate() + daysOffset);
    startTime.setHours(Math.floor(Math.random() * 8) + 8, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 2);

    const room = createdRooms[Math.floor(Math.random() * createdRooms.length)];
    const user = requesters[Math.floor(Math.random() * requesters.length)];
    const status = [
      ReservationStatus.PENDING,
      ReservationStatus.APPROVED,
      ReservationStatus.REJECTED,
    ][Math.floor(Math.random() * 3)];

    const schedule = await prisma.schedule.create({
      data: {
        roomId: room.id,
        startTime,
        endTime,
        isBlocked: status === ReservationStatus.APPROVED,
      },
    });

    await prisma.reservation.create({
      data: {
        userId: user.id,
        roomId: room.id,
        scheduleId: schedule.id,
        status,
        purpose: purposes[Math.floor(Math.random() * purposes.length)],
        approvalStages: {
          create:
            status === ReservationStatus.PENDING
              ? [
                  {
                    stage: StageStatus.REQUESTED,
                    approverId:
                      aggregators[
                        Math.floor(Math.random() * aggregators.length)
                      ].id,
                    status: ReservationStatus.APPROVED,
                    notes: "Dokumen lengkap, diteruskan ke Pimpinan.",
                    approvedAt: new Date(),
                  },
                  {
                    stage: StageStatus.APPROVED,
                    approverId:
                      approvers[Math.floor(Math.random() * approvers.length)]
                        .id,
                    status: ReservationStatus.PENDING,
                  },
                ]
              : [
                  {
                    stage: StageStatus.REQUESTED,
                    approverId:
                      aggregators[
                        Math.floor(Math.random() * aggregators.length)
                      ].id,
                    status: ReservationStatus.APPROVED,
                    approvedAt: new Date(),
                  },
                  {
                    stage: StageStatus.APPROVED,
                    approverId:
                      approvers[Math.floor(Math.random() * approvers.length)]
                        .id,
                    status:
                      status === ReservationStatus.APPROVED
                        ? ReservationStatus.APPROVED
                        : ReservationStatus.REJECTED,
                    notes:
                      status === ReservationStatus.REJECTED
                        ? "Jadwal bentrok dengan agenda universitas."
                        : "Silahkan dipergunakan sesuai kebutuhan.",
                    approvedAt:
                      status === ReservationStatus.APPROVED ? new Date() : null,
                  },
                ],
        },
      },
    });

    await prisma.notification.create({
      data: {
        userId: user.id,
        message: `Reservasi di ${room.name} berstatus ${status}.`,
        link: "/requester/reservations",
        timestamp: new Date(),
      },
    });
  }

  console.log("Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
