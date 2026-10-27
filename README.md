# STARRZ Sign-in

The consent page for the STARRZ Memory MCP server. Supabase Auth's OAuth server sends the
browser here (`consent.html?authorization_id=...`) when an app such as ChatGPT asks to connect.

This repository holds no keys or secrets. The page calls a Supabase Edge Function
(`starrz-oauth`) that does the sign-in work server-side, and only an allowlisted account
can sign in or approve a request.
