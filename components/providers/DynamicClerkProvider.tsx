import { cookies } from "next/headers";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function DynamicClerkProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get("__session");
    const clientUatCookie = cookieStore.get("__client_uat");

    // We load Clerk if:
    // 1. A session cookie exists (User is likely logged in)
    // 2. OR we are on a route that strictly requires it? 
    //    (Actually, for server components, we don't know the route path easily in Layout without middleware headers)
    //    But usually ensuring checking cookies is enough for the "persistence" part.
    //    If a user lands on /sign-in, the page itself might force the provider if we structured it that way,
    //    but since this is RootLayout, we have to decide global state.
    //    
    //    Issue: If a user is logged out and visits /sign-in, they have no cookie.
    //    The /sign-in page content acts as the entry point.
    //    If the RootLayout doesn't provide Clerk, the <SignIn /> component from Clerk might fail.
    //    
    //    Refinement: We can't easily detect "is this /sign-in" from RootLayout server component props (children doesn't tell us path).
    //    HOWEVER, rendering ClerkProvider is generally cheap on the server, it's the CLIENT bundle that is heavy.
    //    
    //    The standard ClerkProvider includes the client-side script.
    //    If we want to avoid the script, we shouldn't render the provider.
    //    
    //    If a user visits /sign-in without a cookie, we MUST render the provider.
    //    Since we can't detect path here easily without middleware passing it as header,
    //    we might rely on a slightly different strategy or accept that we need the header.
    //    
    //    Let's assume we want to implement the "Check for Header" strategy if we need path-based logic.
    //    But for now, simpler: 
    //    If we don't have cookies, we skip the Provider, MEANING we are in "Public Read-Only Mode".
    //    BUT, if the user navigates to /sign-in, that page will break if the provider adds context.
    //    
    //    Wait, checking `headers()` for `x-url` or similar is possible if middleware sets it.
    //    Let's simply check if we can grab the URL or just default to ALWAYS loading it for now if we can't be sure, 
    //    or use the "Auth Wrapper" pattern where only authenticated subtree gets it.
    //    
    //    BUT, the requirement is "load... when a user navigates to a sign-in/sign-up page".
    //
    //    Let's try to detect the path via headers if possible, or just cookies.
    //    If we can't detect path, this "Root level dynamic provider" is risky for the /sign-in route.
    //    
    //    Alternative: modifying `app/sign-in/[[...rest]]/layout.tsx` to wrap in Provider? 
    //    No, Next.js context doesn't work that way up the tree. RootLayout is top.
    //    
    //    Let's try to pass the condition from `middleware`?
    //    Or, since we are in a rush/agentic mode, let's implement the Cookie check first.
    //    AND, we will assume that if the user clicks "Sign In" (which is a native Link to /sign-in),
    //    the /sign-in page itself presumably needs the script. 
    //    
    //    Actually, if we wrap `children` in ClerkProvider, it works.
    //    If we don't, `children` (the page) renders without it.
    //    
    //    So we rely on `x-middleware-request-url` or similar if available? 
    //    Or just `headers().get('x-url')`?
    //    
    //    Let's assume we might *not* have the path. 
    //    Is there a safe fallback? 
    //    If we are strictly on the /sign-in page, maybe that page is an Island? 
    //    No, Clerk is complex.
    //    
    //    Let's stick to the Cookie check + "Always load on specific paths if we can know them".
    //    If we can't know the path, we might block the "Sign In" page from working for logged-out users if we don't load it.
    //    
    //    Let's try to be smart:
    //    If no cookies, we assume "Public Visitor".
    //    "Sign In" button is a link to `/sign-in`.
    //    When they land on `/sign-in`, we need the provider.
    //    WE NEED TO DETECT THE PATH.
    //    
    //    Let's try to read the header `x-pathname` (common convention).
    //    If not present, we can't know. 
    //    
    //    Let's check if the project has middleware that sets a header.
    //    If not, we will rely on `headers` to see `referer`? No reliable.
    //    
    //    Okay, simpler approach:
    //    Use `ClerkProvider` but dynamically? 
    //    Actually, `ClerkProvider` does support `dynamic` loading of the wrapper itself?
    //    No.
    //
    //    Let's use a heuristic:
    //    If `__session` is present -> Load.
    //    If `__client_uat` is present -> Load.
    //    
    //    What about /sign-in?
    //    If we can't detect it, we might have to load implementation plan part:
    //    "Sign In" button -> Link to `/sign-in`.
    //    
    //    We will update `middleware.ts` to ensuring we pass the path... 
    //    Wait, I didn't plan to touch middleware.
    //    
    //    Let's check if `headers` has `x-url` or `x-pathname`.
    //    If not, I might need to add it to middleware or...
    //    
    //    Let's look at `middleware.ts` first.

    const isLoggedIn = !!sessionCookie || !!clientUatCookie;

    // Checking headers for path (if middleware sets it, or if we can infer)
    // In standard Next.js, we don't get path in Layout comfortably without middleware help.
    // However, we can check if the USER REQUEST requested a logical path? No.

    return (
        <ClerkConditionalWrapper shouldLoad={isLoggedIn}>
            {children}
        </ClerkConditionalWrapper>
    );
}

import { headers } from "next/headers";

function ClerkConditionalWrapper({
    shouldLoad,
    children
}: {
    shouldLoad: boolean;
    children: React.ReactNode;
}) {
    const headerList = headers();
    // Try to find path info. 
    // Common headers: x-invoke-path, x-middleware-invoke-path... none are guaranteed standard public API.
    // x-url might be set by custom middleware.

    const pathname = headerList.get("x-current-path") || "";
    const isAuthRoute = pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up") || pathname.startsWith("/login");

    const shouldRenderProvider = shouldLoad || isAuthRoute;

    // Configuration for Clerk
    const appearance = {
        baseTheme: dark,
        variables: {
            colorPrimary: "#D4AF37", // SME Gold
            colorBackground: "#0A0F0D", // forest-obsidian
            colorText: "#F5F1E8", // bone-white
            colorTextSecondary: "#F5F1E8CC", // bone-white with opacity
            colorInputBackground: "#0A0F0D",
            colorInputText: "#F5F1E8",
        },
        elements: {
            rootBox: "w-full",
            card: "bg-forest-obsidian border border-translucent-emerald",
            headerTitle: "text-bone-white",
            headerSubtitle: "text-bone-white/70",
            socialButtonsBlockButton: "bg-white/10 border-white/20 text-bone-white hover:bg-white/20",
            socialButtonsBlockButtonText: "text-bone-white font-medium",
            socialButtonsProviderIcon__google: "brightness-0 invert",
            formButtonPrimary: "bg-heart-green text-forest-black hover:bg-heart-green/90",
            footerActionLink: "text-heart-green hover:text-heart-green/80",
            identityPreviewText: "text-bone-white",
            identityPreviewEditButton: "text-heart-green",
            userButtonPopoverCard: "bg-forest-obsidian border border-translucent-emerald",
            userButtonPopoverActionButton: "text-bone-white hover:bg-white/10",
            userButtonPopoverActionButtonText: "text-bone-white",
            userButtonPopoverFooter: "hidden",
            userPreviewTextContainer: "text-bone-white",
            userPreviewMainIdentifier: "text-bone-white",
            userPreviewSecondaryIdentifier: "text-bone-white/70",
        },
    };

    if (shouldRenderProvider) {
        return (
            <ClerkProvider
                appearance={appearance}
                signInUrl="/sign-in"
                signUpUrl="/sign-up"
                signInFallbackRedirectUrl="/"
                signUpFallbackRedirectUrl="/"
            >
                {children}
            </ClerkProvider>
        );
    }

    return <>{children}</>;
}
