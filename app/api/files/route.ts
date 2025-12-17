import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// Security: Only allow reading from workspace directory
const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || process.cwd();

async function readDirectory(dirPath: string): Promise<any[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const nodes = [];

    for (const entry of entries) {
      // Skip hidden files and node_modules
      if (entry.name.startsWith(".") || entry.name === "node_modules") {
        continue;
      }

      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(WORKSPACE_ROOT, fullPath);

      if (entry.isDirectory()) {
        const children = await readDirectory(fullPath);
        nodes.push({
          name: entry.name,
          path: relativePath,
          type: "directory",
          children,
        });
      } else {
        nodes.push({
          name: entry.name,
          path: relativePath,
          type: "file",
        });
      }
    }

    return nodes.sort((a, b) => {
      // Directories first
      if (a.type !== b.type) {
        return a.type === "directory" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
    return [];
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filePath = searchParams.get("path");

    if (!filePath) {
      // Return root directory structure
      const tree = await readDirectory(WORKSPACE_ROOT);
      return NextResponse.json({ tree });
    }

    // Read specific file
    const fullPath = path.join(WORKSPACE_ROOT, filePath);
    
    // Security check: ensure path is within workspace
    const resolvedPath = path.resolve(fullPath);
    const resolvedRoot = path.resolve(WORKSPACE_ROOT);
    
    if (!resolvedPath.startsWith(resolvedRoot)) {
      return NextResponse.json(
        { error: "Access denied: path outside workspace" },
        { status: 403 }
      );
    }

    const content = await fs.readFile(fullPath, "utf-8");
    return NextResponse.json({ content });
  } catch (error: any) {
    console.error("File API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to read file" },
      { status: 500 }
    );
  }
}

