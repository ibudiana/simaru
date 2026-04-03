"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getReportData } from "@/app/actions/admin";

export function ReportDownloadButton() {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    const toastId = toast.loading("Menyiapkan data laporan...");

    try {
      const data = await getReportData({
        type: "monthly",
        month: new Date().getMonth(),
        year: new Date().getFullYear(),
      });

      if (!data || data.length === 0) {
        toast.error("Tidak ada data reservasi untuk periode ini", {
          id: toastId,
        });
        return;
      }

      // Generate CSV manually
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(","),
        ...data.map((row: (typeof data)[number]) =>
          headers
            .map((header) => {
              const cell =
                (row as Record<string, unknown>)[header]?.toString() || "";
              // Escape double quotes and wrap in quotes if contains comma
              return `"${cell.replace(/"/g, '""')}"`;
            })
            .join(","),
        ),
      ].join("\n");

      // Create blob and trigger download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const timestamp = new Date().toISOString().split("T")[0];

      link.setAttribute("href", url);
      link.setAttribute("download", `Laporan_SIMARU_${timestamp}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Laporan berhasil diunduh!", { id: toastId });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Gagal mengunduh laporan";
      console.error("Download error:", error);
      toast.error(message, { id: toastId });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={isDownloading}
      className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white rounded-xl py-6 font-bold shadow-lg shadow-green-100 transition-all active:scale-95"
    >
      {isDownloading ? (
        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
      ) : (
        <Download className="h-5 w-5 mr-2" />
      )}
      Download Laporan (CSV)
    </Button>
  );
}
