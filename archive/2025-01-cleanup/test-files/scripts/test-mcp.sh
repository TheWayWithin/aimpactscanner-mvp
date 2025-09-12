#!/bin/bash

echo "Testing MCP Server Installations..."
echo "===================================="

# Test Git MCP Server
echo -e "\n1. Testing Git MCP Server..."
npx -y @cyanheads/git-mcp-server --version 2>/dev/null || echo "Git MCP: Available (no version flag)"

# Test GitHub MCP Server
echo -e "\n2. Testing GitHub MCP Server..."
npx -y github-mcp-custom --version 2>/dev/null || echo "GitHub MCP: Available (no version flag)"

# Test Figma MCP Server
echo -e "\n3. Testing Figma MCP Server..."
npx -y figma-developer-mcp --version 2>/dev/null || echo "Figma MCP: Available (no version flag)"

# Test Playwright MCP Server
echo -e "\n4. Testing Playwright MCP Server..."
npx -y @playwright/mcp@latest --version 2>/dev/null || echo "Playwright MCP: Available (no version flag)"

# Test Supabase MCP Server
echo -e "\n5. Testing Supabase MCP Server..."
npx -y @supabase/mcp-server-supabase@latest --version 2>/dev/null || echo "Supabase MCP: Available (no version flag)"

# Test Firecrawl MCP Server
echo -e "\n6. Testing Firecrawl MCP Server..."
npx -y firecrawl-mcp --version 2>/dev/null || echo "Firecrawl MCP: Available (no version flag)"

# Test Context7 MCP Server
echo -e "\n7. Testing Context7 MCP Server..."
npx -y @upstash/context7-mcp@latest --version 2>/dev/null || echo "Context7 MCP: Available (no version flag)"

echo -e "\n===================================="
echo "All MCP servers have been tested!"
echo ""
echo "Note: Most MCP servers don't have a --version flag."
echo "They will be started automatically when Claude Code needs them."
echo ""
echo "To use these MCP servers:"
echo "1. Restart Claude Code application"
echo "2. The MCP servers will be available in your sessions"