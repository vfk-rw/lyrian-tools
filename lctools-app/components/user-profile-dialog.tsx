"use client"

import { useState, useEffect } from "react"
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

type DiscordRole = {
  id: string
  name: string
  color: number
}

export function UserProfileDialog() {
  const { data: session } = useSession()
  const [roles, setRoles] = useState<DiscordRole[]>([])
  const [open, setOpen] = useState(false)
  
  useEffect(() => {
    // Fetch role details when dialog opens
    if (open && session?.user?.accessToken && session?.user?.roles) {
      const fetchRoleDetails = async () => {
        const guildId = process.env.NEXT_PUBLIC_DISCORD_SERVER_ID || session?.user?.guildId
        if (!guildId) return
        
        try {
          // Try to get guild roles to enrich the role data
          const response = await fetch(`https://discord.com/api/guilds/${guildId}/roles`, {
            headers: {
              Authorization: `Bearer ${session.user.accessToken}`,
            }
          })
          
          if (response.ok) {
            const guildRoles = await response.json()
            // Filter to only include user's roles with details
            const userRoleDetails = guildRoles.filter((role: DiscordRole) => 
              session.user.roles.includes(role.id)
            )
            setRoles(userRoleDetails)
          }
        } catch (error) {
          console.error("Failed to fetch role details:", error)
          // Fallback to basic role IDs
          setRoles(session.user.roles.map((id: string) => ({ id, name: id, color: 0 })))
        }
      }
      
      fetchRoleDetails()
    }
  }, [open, session])
  
  if (!session) {
    return null
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center space-x-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 w-full">
          <Avatar className="h-6 w-6">
            {session.user?.image ? (
              <AvatarImage src={session.user.image} />
            ) : (
              <AvatarFallback>{session.user?.name?.charAt(0)}</AvatarFallback>
            )}
          </Avatar>
          <span className="text-sm">{session.user?.name}</span>
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
                <AvatarImage src={session.user.image} />
              ) : (
                <AvatarFallback>{session.user?.name?.charAt(0)}</AvatarFallback>
              )}
            </Avatar>
            <div>
              <h3 className="font-medium">{session.user?.name}</h3>
              <p className="text-sm text-slate-500">{session.user?.email}</p>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Server</h4>
            <p className="text-sm">{session.user?.guildName || "Unknown server"}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Roles</h4>
            <div className="flex flex-wrap gap-2">
              {roles.length > 0 ? (
                roles.map((role) => (
                  <Badge 
                    key={role.id} 
                    style={{ backgroundColor: role.color ? `#${role.color.toString(16)}` : undefined }}
                  >
                    {role.name}
                  </Badge>
                ))
              ) : session.user?.roles ? (
                session.user.roles.map((roleId: string) => (
                  <Badge key={roleId}>{roleId}</Badge>
                ))
              ) : (
                <span className="text-sm text-slate-500">No roles found</span>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}