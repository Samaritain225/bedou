import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { MonthlyBudget } from "../features/budgets/types";
import { Budget, Category } from "../features/categories/types";
import { budgetsService, categoriesService, monthlyBudgetsService } from "../services/firestore";
import type { CategoryDocument } from "../types/firestore";
import { getCurrentMonthYYYYMM } from "../utils/dateHelpers";
import { useAuth } from "./AuthProvider"; // Added import

type CategoriesContextValue = {
  categories: Category[];
  budgets: Budget[];
  currentMonth: string;
  monthlyBudget: MonthlyBudget | null;
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
  getMonthlyBudget: (monthYYYYMM?: string) => Promise<MonthlyBudget | null>;
  setMonthlyBudget: (monthYYYYMM: string, amountBase: number) => Promise<void>;
  deleteMonthlyBudget: (monthYYYYMM: string) => Promise<void>;
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
  const { user } = useAuth(); // Get user from auth context
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [monthlyBudget, setMonthlyBudgetState] = useState<MonthlyBudget | null>(null);
  const [currentMonth, setCurrentMonth] = useState<string>(
    getCurrentMonthYYYYMM()
  );

  const refresh = useCallback(async () => {
    try {
      // Load categories and budgets from Firestore
      const [categoriesDocs, budgetsDocs] = await Promise.all([
        categoriesService.getAll([['userId', '==', 'test-user']]),
        budgetsService.getBudgetsForMonth('test-user', currentMonth),
      ]);

      // Convert Firestore documents to local types
      const cats: Category[] = categoriesDocs.map(doc => ({
        id: doc.id!,
        userId: doc.userId,
        name: doc.name,
        type: doc.type,
        icon: doc.icon || '',
        color: doc.color || '',
        createdAt: typeof doc.createdAt === 'string' ? doc.createdAt : doc.createdAt?.toDate().toISOString() || new Date().toISOString(),
        updatedAt: typeof doc.updatedAt === 'string' ? doc.updatedAt : doc.updatedAt?.toDate().toISOString() || new Date().toISOString(),
      }));

      const buds: Budget[] = budgetsDocs.map(doc => ({
        id: doc.id!,
        categoryId: doc.categoryId,
        monthYYYYMM: doc.monthYYYYMM,
        amountBase: doc.amountBase,
        createdAt: typeof doc.createdAt === 'string' ? doc.createdAt : doc.createdAt?.toDate().toISOString() || new Date().toISOString(),
        updatedAt: typeof doc.updatedAt === 'string' ? doc.updatedAt : doc.updatedAt?.toDate().toISOString() || new Date().toISOString(),
      }));

      setCategories(cats);
      setBudgets(buds);
      
      console.log(`📦 Loaded ${cats.length} categories and ${buds.length} budgets from Firestore`);
    } catch (error) {
      console.error('Error refreshing categories and budgets:', error);
      setCategories([]);
      setBudgets([]);
      setMonthlyBudgetState(null);
    }
  }, [currentMonth]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleAddCategory = useCallback(
    async (c: Omit<Category, "id">) => {
      const categoryDoc: Omit<CategoryDocument, 'id'> = {
        userId: 'test-user',
        name: c.name,
        type: c.type,
        icon: c.icon,
        color: c.color,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const id = await categoriesService.create(categoryDoc);
      await refresh();
      console.log(`✅ Category created: ${c.name}`);
      return id;
    },
    [refresh]
  );

  const handleUpdateCategory = useCallback(
    async (c: Category) => {
      await categoriesService.update(c.id, {
        name: c.name,
        type: c.type,
        icon: c.icon,
        color: c.color,
        updatedAt: new Date().toISOString(),
      });
      await refresh();
      console.log(`✅ Category updated: ${c.name}`);
    },
    [refresh]
  );

  const handleDeleteCategory = useCallback(
    async (id: string) => {
      await categoriesService.delete(id);
      await refresh();
      console.log(`✅ Category deleted: ${id}`);
    },
    [refresh]
  );

  const handleGetCategory = useCallback(
    async (id: string) => {
      const doc = await categoriesService.getById(id);
      if (!doc) return null;
      return {
        id: doc.id!,
        userId: doc.userId,
        name: doc.name,
        type: doc.type,
        icon: doc.icon,
        color: doc.color,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      };
    },
    []
  );

  const handleSetBudget = useCallback(
    async (categoryId: string, monthYYYYMM: string, amountBase: number) => {
      await budgetsService.upsertBudget({
        categoryId,
        monthYYYYMM,
        amountBase,
        userId: 'test-user', // TODO: Use actual user ID
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await refresh();
      console.log(`✅ Budget set for category ${categoryId}`);
    },
    [refresh]
  );

  const handleGetBudget = useCallback(
    async (categoryId: string, monthYYYYMM?: string) => {
      const targetMonth = monthYYYYMM || currentMonth;
      const budget = budgets.find(
        (b) => b.categoryId === categoryId && b.monthYYYYMM === targetMonth
      );
      return budget || null;
    },
    [budgets, currentMonth]
  );

  const handleDeleteBudget = useCallback(
    async (id: string) => {
      await budgetsService.deleteBudget(id);
      await refresh();
      console.log(`✅ Budget deleted: ${id}`);
    },
    [refresh]
  );

  const handleGetMonthlyBudget = useCallback(
    async (monthYYYYMM?: string) => {
      const targetMonth = monthYYYYMM || currentMonth;
      if (monthlyBudget && monthlyBudget.monthYYYYMM === targetMonth) {
        return monthlyBudget;
      }
      // If not in state, try to fetch (though refresh should handle it)
      const doc = await monthlyBudgetsService.getMonthlyBudget('test-user', targetMonth);
      if (doc) {
        return {
          id: doc.id!,
          monthYYYYMM: doc.monthYYYYMM,
          amountBase: doc.amountBase,
          createdAt: typeof doc.createdAt === 'string' ? doc.createdAt : doc.createdAt?.toDate().toISOString() || new Date().toISOString(),
          updatedAt: typeof doc.updatedAt === 'string' ? doc.updatedAt : doc.updatedAt?.toDate().toISOString() || new Date().toISOString(),
        };
      }
      return null;
    },
    [currentMonth, monthlyBudget]
  );

  const handleSetMonthlyBudget = useCallback(
    async (monthYYYYMM: string, amountBase: number) => {
      await monthlyBudgetsService.upsertMonthlyBudget({
        monthYYYYMM,
        amountBase,
        userId: 'test-user', // TODO: Use actual user ID
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await refresh();
      console.log(`✅ Monthly budget set for ${monthYYYYMM}`);
    },
    [refresh]
  );

  const handleDeleteMonthlyBudget = useCallback(
    async (monthYYYYMM: string) => {
      await monthlyBudgetsService.deleteMonthlyBudget('test-user', monthYYYYMM);
      await refresh();
      console.log(`✅ Monthly budget deleted for ${monthYYYYMM}`);
    },
    [refresh]
  );

  const value = useMemo<CategoriesContextValue>(
    () => ({
      categories,
      budgets,
      monthlyBudget,
      currentMonth,
      refresh,
      addCategory: handleAddCategory,
      updateCategory: handleUpdateCategory,
      deleteCategory: handleDeleteCategory,
      getCategory: handleGetCategory,
      setBudget: handleSetBudget,
      getBudget: handleGetBudget,
      deleteBudget: handleDeleteBudget,
      getMonthlyBudget: handleGetMonthlyBudget,
      setMonthlyBudget: handleSetMonthlyBudget,
      deleteMonthlyBudget: handleDeleteMonthlyBudget,
      setCurrentMonth,
    }),
    [
      categories,
      budgets,
      monthlyBudget,
      currentMonth,
      refresh,
      handleAddCategory,
      handleUpdateCategory,
      handleDeleteCategory,
      handleGetCategory,
      handleSetBudget,
      handleGetBudget,
      handleDeleteBudget,
      handleGetMonthlyBudget,
      handleSetMonthlyBudget,
      handleDeleteMonthlyBudget,
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
