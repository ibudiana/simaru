'use client'

import { useActionState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { login } from '@/app/actions/auth'
import { CalendarRange, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [state, action, isPending] = useActionState(login, undefined)

  return (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-50 px-4">
      <div className="absolute inset-0 z-0 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px]"></div>
      <Card className="z-10 w-full max-w-sm border shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <CalendarRange className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-center">SIMARU</CardTitle>
          <CardDescription className="text-center">
            Sistem Manajemen & Reservasi Ruangan Terpadu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="mahasiswa@univ.edu" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            {state?.error && (
              <p className="text-sm font-medium text-destructive">{state.error}</p>
            )}
            <Button className="w-full" type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isPending ? 'Memproses...' : 'Masuk Sistem'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-center text-sm text-muted-foreground">
          <p>Login Default Demo:</p>
          <div className="bg-muted p-2 rounded-md text-xs w-full">
            <p><strong>Req:</strong> andi@univ.edu / password123</p>
            <p><strong>Adm:</strong> admin@univ.edu / password123</p>
            <p><strong>App:</strong> kaprodi@univ.edu / password123</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
