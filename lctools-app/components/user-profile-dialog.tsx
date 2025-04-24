"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

type UserWithRoles = {
  roles: string[]
  guildName: string
  image?: string
  name?: string
  email?: string
}

export function UserProfileDialog() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  
  if (!session) {
    return null
  }
  
  // Get user roles from session
  const userRoles = (session.user as UserWithRoles).roles || []
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center space-x-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 w-full">
          <Avatar className="h-6 w-6">
            {session.user?.image ? (
              <AvatarImage src={(session.user as UserWithRoles).image} />
            ) : (
              <AvatarFallback>{(session.user as UserWithRoles).name?.charAt(0)}</AvatarFallback>
            )}
          </Avatar>
          <span className="text-sm">{(session.user as UserWithRoles).name}</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Discord Profile</DialogTitle>
          <DialogDescription>
            Your Discord profile information
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-4 py-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              {session.user?.image ? (
                <AvatarImage src={(session.user as UserWithRoles).image} />
              ) : (
                <AvatarFallback>{(session.user as UserWithRoles).name?.charAt(0)}</AvatarFallback>
              )}
            </Avatar>
            <div>
              <h3 className="font-medium">{(session.user as UserWithRoles).name}</h3>
              <p className="text-sm text-slate-500">{(session.user as UserWithRoles).email}</p>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Server</h4>
            <p className="text-sm">{(session.user as UserWithRoles).guildName || "Unknown server"}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Roles</h4>
            <div className="flex flex-wrap gap-2">
              {userRoles.length > 0 ? (
                userRoles.map((roleId: string) => (
                  <Badge key={roleId} variant="outline" className="overflow-hidden text-ellipsis">
                    {roleId}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-slate-500">No roles found</span>
              )}
            </div>
            <p className="text-xs mt-2 text-slate-500">
              Note: Showing role IDs. Role names will be available in a future update.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}