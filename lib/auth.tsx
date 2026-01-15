"use client";

import { ReactNode } from "react";
import Link from "next/link";
import {
    SignedIn as ClerkSignedIn,
    SignedOut as ClerkSignedOut,
    SignInButton as ClerkSignInButton,
    UserButton as ClerkUserButton,
    useUser as useClerkUser,
    useAuth as useClerkAuth
} from "@clerk/nextjs";

// Check if we are in a context where Clerk might be loaded or if we should fallback
// Note: In detailed implementation, we might context-switch this. 
// For now, we rely on the fact that if DynamicClerkProvider didn't load Clerk,
// these components from '@clerk/nextjs' might throw or misbehave if rendered 
// without the provider context. 
//
// However, since we are importing them at module level, they exist. 
// We need a way to know if the Provider is active.
// A simple way is to trust the import, but if the Provider isn't in the tree, 
// using hooks like useUser will throw error in some versions.
//
// To be safe, we will create wrappers that are safe to use even if the provider is missing.

export const SignedIn = ({ children }: { children: ReactNode }) => {
    const isLoaded = useIsClerkLoaded();
    if (isLoaded) {
        return <ClerkSignedIn>{children}</ClerkSignedIn>;
    }
    return null;
};

export const SignedOut = ({ children }: { children: ReactNode }) => {
    const isLoaded = useIsClerkLoaded();
    if (isLoaded) {
        return <ClerkSignedOut>{children}</ClerkSignedOut>;
    }
    // If Clerk provider is missing, we are effectively signed out
    return <>{children}</>;
};

export const SignInButton = ({
    children,
    mode,
    ...props
}: {
    children?: ReactNode;
    mode?: "modal" | "redirect";
    [key: string]: any
}) => {
    // If we want to support the real button when loaded:
    // We can try to render it, but if it fails (no provider), render fallback.
    // Actually, we can just return the fallback if we know we are in "light" mode.
    // But detection is tricky inside a component without context.
    //
    // Strategy: The parent (Navbar) will use this.
    // We'll wrap the standard Clerk component in an ErrorBoundary-like try/catch 
    // or just return a simple Link if the hook fails.

    // Since we can't easily detect the provider existence without try-catching a hook,
    // let's try to use useAuth safely.

    const isLoaded = useIsClerkLoaded();

    if (isLoaded) {
        return <ClerkSignInButton mode={mode} {...props}>{children}</ClerkSignInButton>;
    }

    return (
        <Link href="/sign-in" className={props.className}>
            {children || "Sign In"}
        </Link>
    );
};

export const UserButton = (props: any) => {
    const isLoaded = useIsClerkLoaded();
    if (isLoaded) {
        return <ClerkUserButton {...props} />;
    }
    return null;
};

UserButton.MenuItems = ClerkUserButton.MenuItems;
UserButton.Link = ClerkUserButton.Link;
UserButton.UserProfilePage = ClerkUserButton.UserProfilePage;

export const useUser = () => {
    try {
        return useClerkUser();
    } catch (e) {
        return { isLoaded: true, isSignedIn: false, user: null };
    }
}

export const useAuth = () => {
    try {
        return useClerkAuth();
    } catch (e) {
        return { isLoaded: true, isSignedIn: false, userId: null, sessionId: null };
    }
}


function useIsClerkLoaded() {
    // Helper to check if we can access auth context
    try {
        useClerkAuth();
        return true;
    } catch (e) {
        return false;
    }
}
