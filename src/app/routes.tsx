import { Routes, Route } from 'react-router-dom';
import { ExpensesPage } from '@/features/expenses/ExpensesPage';
import { InventoryPage } from '@/features/expenses/InventoryPage';
import { StatsPage } from '@/features/stats/StatsPage';
import { PortfolioPage } from '@/features/assets/PortfolioPage';
import { PlanningPage } from '@/features/planning/PlanningPage';
import { SettingsPage } from '@/features/profiles/SettingsPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ExpensesPage />} />
      <Route path="/inventario" element={<InventoryPage />} />
      <Route path="/estadisticas" element={<StatsPage />} />
      <Route path="/cartera" element={<PortfolioPage />} />
      <Route path="/planificar" element={<PlanningPage />} />
      <Route path="/ajustes" element={<SettingsPage />} />
    </Routes>
  );
}
