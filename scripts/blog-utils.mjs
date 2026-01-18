import path from "node:path";

export function extractFrontMatter(content) {
  const trimmed = content.trimStart();
  if (!trimmed.startsWith("---")) {
    return { frontMatter: "", body: content };
  }

  const lines = trimmed.split("\n");
  const endIndex = lines.slice(1).findIndex((line) => line.trim() === "---");
  if (endIndex === -1) {
    return { frontMatter: "", body: content };
  }

  const frontMatterLines = lines.slice(1, endIndex + 1);
  const bodyLines = lines.slice(endIndex + 2);

  return {
    frontMatter: frontMatterLines.join("\n").trim(),
    body: bodyLines.join("\n").trim(),
  };
}

export function parseFrontMatter(frontMatter) {
  const data = {
    title: "",
    date: "",
    tags: [],
    categories: [],
  };

  if (!frontMatter) {
    return data;
  }

  let currentKey = "";
  frontMatter.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }

    if (trimmed.startsWith("- ") && currentKey) {
      data[currentKey].push(trimmed.slice(2).trim());
      return;
    }

    const [rawKey, ...rest] = trimmed.split(":");
    if (!rawKey) {
      return;
    }
    const key = rawKey.trim();
    const value = rest.join(":").trim();

    if (key === "tags" || key === "categories") {
      currentKey = key;
      if (value) {
        data[key] = value
          .split(/[,\s]+/)
          .map((item) => item.trim())
          .filter(Boolean);
      }
      return;
    }

    currentKey = "";
    if (key === "title") {
      data.title = value;
    }
    if (key === "date") {
      data.date = value;
    }
  });

  return data;
}

export function slugFromFilename(filename) {
  return path.basename(filename, path.extname(filename));
}

export function normalizeDate(dateStr) {
  if (!dateStr) {
    return null;
  }

  const match = dateStr.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  const pad = (value) => value.toString().padStart(2, "0");

  return {
    year,
    month: pad(month),
    day: pad(day),
  };
}

export function buildPostOutputPath({ date, slug }) {
  const normalized = normalizeDate(date);
  if (!normalized) {
    return path.join("posts", slug, "index.html");
  }

  return path.join(normalized.year, normalized.month, normalized.day, slug, "index.html");
}

export function formatDate(dateStr) {
  if (!dateStr) {
    return "";
  }
  const normalized = normalizeDate(dateStr);
  if (!normalized) {
    return dateStr;
  }
  return `${normalized.year}.${normalized.month}.${normalized.day}`;
}
