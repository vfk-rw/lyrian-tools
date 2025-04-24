import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import type { NextAuthOptions } from "next-auth";

const DISCORD_GUILD_ID = process.env.DISCORD_SERVER_ID;

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "identify email guilds guilds.members.read"
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Add Discord information to the token
      if (account) {
        token.accessToken = account.access_token;
        
        // Fetch the user's guilds
        const guildsRes = await fetch("https://discord.com/api/users/@me/guilds", {
          headers: {
            Authorization: `Bearer ${account.access_token}`,
          },
        });
        
        if (guildsRes.ok) {
          const guilds = await guildsRes.json();
          const targetGuild = guilds.find((g: unknown) => typeof g === 'object' && g !== null && 'id' in g && g.id === DISCORD_GUILD_ID);
          
          if (targetGuild) {
            token.guildName = targetGuild.name;
            
            // Fetch user's roles in the specific guild
            const memberRes = await fetch(`https://discord.com/api/users/@me/guilds/${DISCORD_GUILD_ID}/member`, {
              headers: {
                Authorization: `Bearer ${account.access_token}`,
              },
            });
            
            if (memberRes.ok) {
              const memberData = await memberRes.json();
              token.roles = memberData.roles;
            }
          }
        }
      }
      return token;
    },
    
    async signIn({ account }) {
      // Fetch the user's guilds from Discord
      const res = await fetch("https://discord.com/api/users/@me/guilds", {
        headers: {
          Authorization: `Bearer ${account?.access_token}`,
        },
      });
      if (!res.ok) return false;
      const guilds = await res.json();
      // Check if the user is in the required guild
      const inGuild = guilds.some((g: unknown) => typeof g === 'object' && g !== null && 'id' in g && g.id === DISCORD_GUILD_ID);
      return inGuild;
    },
    
    async session({ session, token }) {
      if (session.user) {
        (session.user as unknown).id = token.sub;
        (session.user as unknown).image = token.picture;
        (session.user as unknown).guildName = token.guildName;
        (session.user as unknown).roles = token.roles;
        (session.user as unknown).accessToken = token.accessToken;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };