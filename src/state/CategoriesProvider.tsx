import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useDb } from "../db/hooks";
import {
  deleteBudget,
  getBudgetByCategoryAndMonth,
  getCurrentMonthYYYYMM,
  listBudgets,
  upsertBudget,
} from "../features/budgets/repository";
import {
  addCategory,
  deleteCategory,
  getCategoryById,
  listCategories,
  updateCategory,
} from "../features/categories/repository";
import { Budget, Category } from "../features/categories/types";

type CategoriesContextValue = {
  categories: Category[];
  budgets: Budget[];
  currentMonth: string;
  refresh: () => Promise<void>;
  addCategory: (c: Omit<Category, "id">) => Promise<string>;
  updateCategory: (c: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getCategory: (id: string) => Promise<Category | null>;
  setBudget: (
    categoryId: string,
    monthYYYYMM: string,
    amountBase: number
  ) => Promise<void>;
  getBudget: (
    categoryId: string,
    monthYYYYMM?: string
  ) => Promise<Budget | null>;
  deleteBudget: (id: string) => Promise<void>;
  setCurrentMonth: (month: string) => void;
};

const CategoriesContext = createContext<CategoriesContextValue | undefined>(
  undefined
);

export function CategoriesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const db = useDb();
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [currentMonth, setCurrentMonth] = useState<string>(
    getCurrentMonthYYYYMM()
  );

  const refresh = useCallback(async () => {
    try {
      const [cats, budgetsList] = await Promise.all([
        listCategories(db),
        listBudgets(currentMonth, db),
      ]);
      setCategories(Array.isArray(cats) ? cats : []);
      setBudgets(Array.isArray(budgetsList) ? budgetsList : []);
    } catch (error) {
      console.error("Error refreshing categories and budgets:", error);
      setCategories([]);
      setBudgets([]);
    }
  }, [db, currentMonth]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleAddCategory = useCallback(
    async (c: Omit<Category, "id">) => {
      const id = await addCategory(c, db);
      await refresh();
      return id;
    },
    [db, refresh]
  );

  const handleUpdateCategory = useCallback(
    async (c: Category) => {
      await updateCategory(c, db);
      await refresh();
    },
    [db, refresh]
  );

  const handleDeleteCategory = useCallback(
    async (id: string) => {
      await deleteCategory(id, db);
      await refresh();
    },
    [db, refresh]
  );

  const handleGetCategory = useCallback(
    async (id: string) => {
      return await getCategoryById(id, db);
    },
    [db]
  );

  const handleSetBudget = useCallback(
    async (categoryId: string, monthYYYYMM: string, amountBase: number) => {
      await upsertBudget({ categoryId, monthYYYYMM, amountBase }, db);
      await refresh();
    },
    [db, refresh]
  );

  const handleGetBudget = useCallback(
    async (categoryId: string, monthYYYYMM?: string) => {
      const targetMonth = monthYYYYMM || currentMonth;
      return await getBudgetByCategoryAndMonth(categoryId, targetMonth, db);
    },
    [db, currentMonth]
  );

  const handleDeleteBudget = useCallback(
    async (id: string) => {
      await deleteBudget(id, db);
      await refresh();
    },
    [db, refresh]
  );

  const value = useMemo<CategoriesContextValue>(
    () => ({
      categories,
      budgets,
      currentMonth,
      refresh,
      addCategory: handleAddCategory,
      updateCategory: handleUpdateCategory,
      deleteCategory: handleDeleteCategory,
      getCategory: handleGetCategory,
      setBudget: handleSetBudget,
      getBudget: handleGetBudget,
      deleteBudget: handleDeleteBudget,
      setCurrentMonth,
    }),
    [
      categories,
      budgets,
      currentMonth,
      refresh,
      handleAddCategory,
      handleUpdateCategory,
      handleDeleteCategory,
      handleGetCategory,
      handleSetBudget,
      handleGetBudget,
      handleDeleteBudget,
    ]
  );

  return (
    <CategoriesContext.Provider value={value}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  const ctx = useContext(CategoriesContext);
  if (!ctx)
    throw new Error("useCategories must be used within CategoriesProvider");
  return ctx;
}
