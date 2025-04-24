import "next-auth"
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's Discord ID */
      id: string
      /** The user's access token */
      accessToken?: string
      /** The Discord guild/server name */
      guildName?: string
      /** Discord guild/server roles */
      roles?: string[]
    } & DefaultSession["user"]
  }
}