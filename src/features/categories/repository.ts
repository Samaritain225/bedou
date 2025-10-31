import { generateUuid, withTransaction } from "../../db";
import { Category } from "./types";

export async function listCategories(db?: any): Promise<Category[]> {
  try {
    if (db) {
      const rows = await db.getAllAsync(
        "SELECT * FROM categories ORDER BY type ASC, name ASC"
      );
      return Array.isArray(rows) ? rows : [];
    }
    const result = await withTransaction(async (tx) => {
      const rows = await tx.getAllAsync(
        "SELECT * FROM categories ORDER BY type ASC, name ASC"
      );
      return rows ?? [];
    });
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Error listing categories:", error);
    return [];
  }
}

export async function getCategoryById(
  id: string,
  db?: any
): Promise<Category | null> {
  try {
    if (db) {
      const row = await db.getFirstAsync(
        "SELECT * FROM categories WHERE id = ?",
        id
      );
      return row || null;
    }
    const result = await withTransaction(async (tx) => {
      return await tx.getFirstAsync(
        "SELECT * FROM categories WHERE id = ?",
        id
      );
    });
    return result || null;
  } catch (error) {
    console.error("Error getting category:", error);
    return null;
  }
}

export async function addCategory(
  category: Omit<Category, "id"> & { id?: string },
  db?: any
): Promise<string> {
  const categoryId = category.id || generateUuid();
  if (db) {
    await db.runAsync(
      "INSERT INTO categories (id, name, color, icon, type) VALUES (?,?,?,?,?)",
      categoryId,
      category.name,
      category.color,
      category.icon,
      category.type
    );
  } else {
    await withTransaction(async (tx) => {
      await tx.runAsync(
        "INSERT INTO categories (id, name, color, icon, type) VALUES (?,?,?,?,?)",
        categoryId,
        category.name,
        category.color,
        category.icon,
        category.type
      );
    });
  }
  return categoryId;
}

export async function updateCategory(
  category: Category,
  db?: any
): Promise<void> {
  if (db) {
    await db.runAsync(
      "UPDATE categories SET name=?, color=?, icon=?, type=? WHERE id=?",
      category.name,
      category.color,
      category.icon,
      category.type,
      category.id
    );
  } else {
    await withTransaction(async (tx) => {
      await tx.runAsync(
        "UPDATE categories SET name=?, color=?, icon=?, type=? WHERE id=?",
        category.name,
        category.color,
        category.icon,
        category.type,
        category.id
      );
    });
  }
}

export async function deleteCategory(id: string, db?: any): Promise<void> {
  if (db) {
    await db.runAsync("DELETE FROM categories WHERE id=?", id);
  } else {
    await withTransaction(async (tx) => {
      await tx.runAsync("DELETE FROM categories WHERE id=?", id);
    });
  }
}
