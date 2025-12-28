import { getConversations, getMessages } from "@/app/actions/messages";
import ChatWindow from "@/components/messages/ChatWindow";
import ConversationList from "@/components/messages/ConversationList";
import { getDb } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function MessagesPage({
    searchParams,
}: {
    searchParams: Promise<{ userId?: string }>;
}) {
    const user = await currentUser();
    if (!user) return redirect("/sign-in");

    const params = await searchParams;
    const conversations = await getConversations();

    let initialMessages: any[] = [];
    let otherUser: any = null;

    if (params.userId) {
        // Determine active conversation context
        // Check if it's already in conversations list
        const activeConv = conversations.find(c => c.other_user.id === params.userId);

        if (activeConv) {
            otherUser = activeConv.other_user;
        } else {
            // Must fetch user details specifically if staring a new convo
            const sql = getDb();
            const res = await sql`
        SELECT id, username, full_name, avatar_url 
        FROM profiles 
        WHERE id = ${params.userId}
      `;
            if (res.length > 0) {
                otherUser = res[0];
            }
        }

        if (otherUser) {
            initialMessages = await getMessages(otherUser.id);
        }
    }

    return (
        <main className="h-[calc(100vh-64px)] bg-forest-obsidian/95 overflow-hidden">
            <div className="mx-auto max-w-6xl h-full grid grid-cols-1 md:grid-cols-[350px_1fr] border-x border-translucent-emerald">
                {/* Sidebar */}
                <div className={`h-full ${params.userId ? "hidden md:block" : "block"}`}>
                    <ConversationList conversations={conversations} />
                </div>

                {/* Main Content */}
                <div className="h-full bg-forest-obsidian relative">
                    {params.userId && otherUser ? (
                        <ChatWindow
                            currentUser={{ id: user.id, avatar_url: user.imageUrl }}
                            otherUser={otherUser}
                            initialMessages={initialMessages}
                        />
                    ) : (
                        <div className="hidden md:flex h-full flex-col items-center justify-center p-8 text-center text-bone-white/40">
                            <div className="mb-4 rounded-full bg-muted-moss/50 p-6">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="h-12 w-12"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-xl font-medium text-bone-white mb-2">Your Messages</h3>
                            <p className="max-w-xs">Select a conversation from the left or find a community member to start chatting.</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
