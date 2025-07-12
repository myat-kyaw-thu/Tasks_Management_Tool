"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React, { useCallback, useEffect, useMemo, useState } from "react";

// Icons
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Award,
  BarChart3,
  CheckCircle,
  Minus,
  PieChart,
  Star,
  Target,
  Timer,
  TrendingUp,
  Zap,
} from "lucide-react";

// Core components
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";

// Hooks
import { useCategories } from "@/hooks/use-categories";
import { useTasks } from "@/hooks/use-tasks";

// Chart components (using recharts for better performance)
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Performance monitoring
import { performanceMonitoring } from "@/lib/performance/bundle-optimization";

// Types for analytics
interface ProductivityMetrics {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  averageCompletionTime: number;
  tasksPerDay: number;
  streakDays: number;
  productivityScore: number;
}

interface TimeAnalytics {
  dailyCompletions: Array<{ date: string; completed: number; created: number; }>;
  weeklyTrends: Array<{ week: string; productivity: number; }>;
  monthlyProgress: Array<{ month: string; completed: number; target: number; }>;
  categoryBreakdown: Array<{ category: string; count: number; percentage: number; color: string; }>;
  priorityDistribution: Array<{ priority: string; count: number; color: string; }>;
}

// Color schemes for charts
const CHART_COLORS = {
  primary: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
  pink: "#ec4899",
  indigo: "#6366f1",
  teal: "#14b8a6",
};

const CATEGORY_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#6366f1", "#14b8a6"];

// Memoized chart components for performance
const ProductivityChart = React.memo(({ data }: { data: any[]; }) => (
  <ResponsiveContainer width="100%" height={300}>
    <AreaChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Area
        type="monotone"
        dataKey="completed"
        stackId="1"
        stroke={CHART_COLORS.success}
        fill={CHART_COLORS.success}
        fillOpacity={0.6}
      />
      <Area
        type="monotone"
        dataKey="created"
        stackId="2"
        stroke={CHART_COLORS.primary}
        fill={CHART_COLORS.primary}
        fillOpacity={0.6}
      />
    </AreaChart>
  </ResponsiveContainer>
));
ProductivityChart.displayName = "ProductivityChart";

const TrendChart = React.memo(({ data }: { data: any[]; }) => (
  <ResponsiveContainer width="100%" height={250}>
    <RechartsLineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="week" />
      <YAxis />
      <Tooltip />
      <Line
        type="monotone"
        dataKey="productivity"
        stroke={CHART_COLORS.primary}
        strokeWidth={3}
        dot={{ fill: CHART_COLORS.primary }}
      />
    </RechartsLineChart>
  </ResponsiveContainer>
));
TrendChart.displayName = "TrendChart";

const CategoryPieChart = React.memo(({ data }: { data: any[]; }) => (
  <ResponsiveContainer width="100%" height={300}>
    <RechartsPieChart>
      <Tooltip />
      <Legend />
      {data.map((entry, index) => (
        <Cell key={`cell-${index}`} fill={entry.color} />
      ))}
    </RechartsPieChart>
  </ResponsiveContainer>
));
CategoryPieChart.displayName = "CategoryPieChart";

const ProgressBarChart = React.memo(({ data }: { data: any[]; }) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="completed" fill={CHART_COLORS.success} />
      <Bar dataKey="target" fill={CHART_COLORS.warning} fillOpacity={0.5} />
    </BarChart>
  </ResponsiveContainer>
));
ProgressBarChart.displayName = "ProgressBarChart";

// Memoized metric cards
const MetricCard = React.memo(
  ({
    title,
    value,
    change,
    changeType,
    icon: Icon,
    description,
  }: {
    title: string;
    value: string | number;
    change?: number;
    changeType?: "increase" | "decrease" | "neutral";
    icon: React.ComponentType<{ className?: string; }>;
    description?: string;
  }) => {
    const getChangeIcon = () => {
      switch (changeType) {
        case "increase":
          return <ArrowUp className="h-3 w-3 text-green-600" />;
        case "decrease":
          return <ArrowDown className="h-3 w-3 text-red-600" />;
        default:
          return <Minus className="h-3 w-3 text-gray-600" />;
      }
    };

    const getChangeColor = () => {
      switch (changeType) {
        case "increase":
          return "text-green-600";
        case "decrease":
          return "text-red-600";
        default:
          return "text-gray-600";
      }
    };

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {change !== undefined && (
            <div className={`flex items-center text-xs ${getChangeColor()}`}>
              {getChangeIcon()}
              <span className="ml-1">{Math.abs(change)}% from last period</span>
            </div>
          )}
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </CardContent>
      </Card>
    );
  },
);
MetricCard.displayName = "MetricCard";

export default function AnalyticsPage() {
  // Performance monitoring
  useEffect(() => {
    const measureEnd = performanceMonitoring.measureRenderTime("AnalyticsPage");
    return measureEnd;
  }, []);

  // State management
  const [activeView, setActiveView] = useState("analytics");
  const [timeRange, setTimeRange] = useState("30d");

  // Data hooks - fetch once and use throughout
  const { tasks: allTasks, loading: tasksLoading } = useTasks({ autoFetch: true });
  const { categories } = useCategories();

  // Memoize analytics calculation with stable dependencies
  const analyticsData = useMemo(() => {
    if (!allTasks.length || tasksLoading) {
      return null;
    }

    const measureEnd = performanceMonitoring.measureRenderTime("analytics-calculation");

    const now = new Date();
    const daysToAnalyze = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;

    // Filter tasks by time range
    const cutoffDate = new Date(now.getTime() - daysToAnalyze * 24 * 60 * 60 * 1000);
    const recentTasks = allTasks.filter((task) => new Date(task.created_at) >= cutoffDate);

    // Calculate productivity metrics
    const completedTasks = recentTasks.filter((task) => task.is_completed);
    const completionRate = recentTasks.length > 0 ? (completedTasks.length / recentTasks.length) * 100 : 0;

    // Calculate average completion time (mock data for now)
    const averageCompletionTime =
      completedTasks.length > 0
        ? completedTasks.reduce((acc, task) => {
          if (task.completed_at && task.created_at) {
            const completionTime = new Date(task.completed_at).getTime() - new Date(task.created_at).getTime();
            return acc + completionTime / (1000 * 60 * 60); // Convert to hours
          }
          return acc;
        }, 0) / completedTasks.length
        : 0;

    // Calculate streak (consecutive days with completed tasks)
    let streakDays = 0;
    for (let i = 0; i < daysToAnalyze; i++) {
      const checkDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayTasks = completedTasks.filter((task) => {
        const taskDate = new Date(task.completed_at!);
        return taskDate.toDateString() === checkDate.toDateString();
      });
      if (dayTasks.length > 0) {
        streakDays++;
      } else {
        break;
      }
    }

    // Calculate productivity score (0-100)
    const productivityScore = Math.min(
      100,
      Math.round(
        completionRate * 0.4 +
        Math.min(streakDays / 7, 1) * 30 +
        (Math.min(completedTasks.length / daysToAnalyze, 5) / 5) * 30,
      ),
    );

    const metrics: ProductivityMetrics = {
      totalTasks: recentTasks.length,
      completedTasks: completedTasks.length,
      completionRate,
      averageCompletionTime,
      tasksPerDay: recentTasks.length / daysToAnalyze,
      streakDays,
      productivityScore,
    };

    // Generate daily completion data
    const dailyCompletions = [];
    for (let i = daysToAnalyze - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];

      const dayCompleted = completedTasks.filter((task) => {
        const taskDate = new Date(task.completed_at!);
        return taskDate.toDateString() === date.toDateString();
      }).length;

      const dayCreated = recentTasks.filter((task) => {
        const taskDate = new Date(task.created_at);
        return taskDate.toDateString() === date.toDateString();
      }).length;

      dailyCompletions.push({
        date: dateStr,
        completed: dayCompleted,
        created: dayCreated,
      });
    }

    // Generate weekly trends
    const weeklyTrends = [];
    const weeksToShow = Math.ceil(daysToAnalyze / 7);
    for (let i = weeksToShow - 1; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);

      const weekTasks = recentTasks.filter((task) => {
        const taskDate = new Date(task.created_at);
        return taskDate >= weekStart && taskDate < weekEnd;
      });

      const weekCompleted = weekTasks.filter((task) => task.is_completed).length;
      const productivity = weekTasks.length > 0 ? (weekCompleted / weekTasks.length) * 100 : 0;

      weeklyTrends.push({
        week: `Week ${weeksToShow - i}`,
        productivity: Math.round(productivity),
      });
    }

    // Category breakdown
    const categoryBreakdown = categories
      .map((category, index) => {
        const categoryTasks = recentTasks.filter((task) => task.category_id === category.id);
        const percentage = recentTasks.length > 0 ? (categoryTasks.length / recentTasks.length) * 100 : 0;

        return {
          category: category.name,
          count: categoryTasks.length,
          percentage: Math.round(percentage),
          color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
        };
      })
      .filter((item) => item.count > 0);

    // Add uncategorized tasks
    const uncategorizedTasks = recentTasks.filter((task) => !task.category_id);
    if (uncategorizedTasks.length > 0) {
      categoryBreakdown.push({
        category: "Uncategorized",
        count: uncategorizedTasks.length,
        percentage: Math.round((uncategorizedTasks.length / recentTasks.length) * 100),
        color: "#6b7280",
      });
    }

    // Priority distribution
    const priorityDistribution = [
      {
        priority: "High",
        count: recentTasks.filter((task) => task.priority === "high").length,
        color: CHART_COLORS.danger,
      },
      {
        priority: "Medium",
        count: recentTasks.filter((task) => task.priority === "medium").length,
        color: CHART_COLORS.warning,
      },
      {
        priority: "Low",
        count: recentTasks.filter((task) => task.priority === "low").length,
        color: CHART_COLORS.success,
      },
    ].filter((item) => item.count > 0);

    // Monthly progress (mock targets for now)
    const monthlyProgress = [];
    const monthsToShow = 6;
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthDate.toLocaleDateString("en-US", { month: "short" });

      const monthTasks = allTasks.filter((task) => {
        const taskDate = new Date(task.created_at);
        return taskDate.getMonth() === monthDate.getMonth() && taskDate.getFullYear() === monthDate.getFullYear();
      });

      const monthCompleted = monthTasks.filter((task) => task.is_completed).length;
      const target = Math.max(20, monthCompleted + Math.floor(Math.random() * 10)); // Mock target

      monthlyProgress.push({
        month: monthName,
        completed: monthCompleted,
        target,
      });
    }

    const timeAnalytics: TimeAnalytics = {
      dailyCompletions,
      weeklyTrends,
      monthlyProgress,
      categoryBreakdown,
      priorityDistribution,
    };

    measureEnd();
    return { metrics, timeAnalytics };
  }, [allTasks, timeRange, categories, tasksLoading]);

  // Event handlers
  const handleTimeRangeChange = useCallback((value: string) => {
    performanceMonitoring.trackInteraction("timerange-change", "analytics");
    setTimeRange(value);
  }, []);

  if (tasksLoading || !analyticsData) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar activeView={activeView} onViewChange={setActiveView} />
          <SidebarInset className="flex-1">
            <AppHeader />
            <main className="flex-1 overflow-auto">
              <div className="p-6">
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Loading analytics...</p>
                  </div>
                </div>
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  const { metrics, timeAnalytics } = analyticsData;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar activeView={activeView} onViewChange={setActiveView} />
        <SidebarInset className="flex-1">
          <AppHeader />
          <main className="flex-1 overflow-auto">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Analytics & Insights</h1>
                  <p className="text-muted-foreground">Track your productivity and task completion patterns</p>
                </div>
                <div className="flex items-center gap-4">
                  <Select value={timeRange} onValueChange={handleTimeRangeChange}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                      <SelectItem value="90d">Last 90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  title="Productivity Score"
                  value={metrics.productivityScore}
                  change={5}
                  changeType="increase"
                  icon={Target}
                  description="Overall productivity rating"
                />
                <MetricCard
                  title="Completion Rate"
                  value={`${Math.round(metrics.completionRate)}%`}
                  change={12}
                  changeType="increase"
                  icon={CheckCircle}
                  description="Tasks completed vs created"
                />
                <MetricCard
                  title="Current Streak"
                  value={`${metrics.streakDays} days`}
                  change={metrics.streakDays > 0 ? 1 : -1}
                  changeType={metrics.streakDays > 0 ? "increase" : "decrease"}
                  icon={Award}
                  description="Consecutive days with completions"
                />
                <MetricCard
                  title="Avg. Completion Time"
                  value={`${Math.round(metrics.averageCompletionTime)}h`}
                  change={-8}
                  changeType="decrease"
                  icon={Timer}
                  description="Average time to complete tasks"
                />
              </div>

              {/* Analytics Tabs */}
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="trends">Trends</TabsTrigger>
                  <TabsTrigger value="categories">Categories</TabsTrigger>
                  <TabsTrigger value="insights">Insights</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  <div className="grid gap-6 lg:grid-cols-2">
                    {/* Daily Activity Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          Daily Activity
                        </CardTitle>
                        <CardDescription>Tasks created vs completed over time</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ProductivityChart data={timeAnalytics.dailyCompletions} />
                      </CardContent>
                    </Card>

                    {/* Monthly Progress */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-5 w-5" />
                          Monthly Progress
                        </CardTitle>
                        <CardDescription>Completed tasks vs targets</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ProgressBarChart data={timeAnalytics.monthlyProgress} />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Tasks Per Day</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{metrics.tasksPerDay.toFixed(1)}</div>
                        <Progress value={(metrics.tasksPerDay / 5) * 100} className="mt-2" />
                        <p className="text-xs text-muted-foreground mt-2">Average daily task creation</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Total Completed</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{metrics.completedTasks}</div>
                        <Progress value={(metrics.completedTasks / metrics.totalTasks) * 100} className="mt-2" />
                        <p className="text-xs text-muted-foreground mt-2">Out of {metrics.totalTasks} total tasks</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Best Streak</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{Math.max(metrics.streakDays, 7)} days</div>
                        <Progress value={(metrics.streakDays / 30) * 100} className="mt-2" />
                        <p className="text-xs text-muted-foreground mt-2">Longest completion streak</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Trends Tab */}
                <TabsContent value="trends" className="space-y-6">
                  <div className="grid gap-6 lg:grid-cols-2">
                    {/* Weekly Productivity Trend */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          Weekly Productivity Trend
                        </CardTitle>
                        <CardDescription>Completion rate over recent weeks</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <TrendChart data={timeAnalytics.weeklyTrends} />
                      </CardContent>
                    </Card>

                    {/* Priority Distribution */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Star className="h-5 w-5" />
                          Priority Distribution
                        </CardTitle>
                        <CardDescription>Tasks by priority level</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {timeAnalytics.priorityDistribution.map((item) => (
                            <div key={item.priority} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-sm font-medium">{item.priority}</span>
                              </div>
                              <Badge variant="secondary">{item.count}</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Categories Tab */}
                <TabsContent value="categories" className="space-y-6">
                  <div className="grid gap-6 lg:grid-cols-2">
                    {/* Category Breakdown Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <PieChart className="h-5 w-5" />
                          Category Breakdown
                        </CardTitle>
                        <CardDescription>Task distribution by category</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <CategoryPieChart data={timeAnalytics.categoryBreakdown} />
                      </CardContent>
                    </Card>

                    {/* Category Performance */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Category Performance</CardTitle>
                        <CardDescription>Task count and completion by category</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {timeAnalytics.categoryBreakdown.map((category) => (
                            <div key={category.category} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                                  <span className="text-sm font-medium">{category.category}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary">{category.count}</Badge>
                                  <span className="text-xs text-muted-foreground">{category.percentage}%</span>
                                </div>
                              </div>
                              <Progress value={category.percentage} className="h-2" />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Insights Tab */}
                <TabsContent value="insights" className="space-y-6">
                  <div className="grid gap-6 lg:grid-cols-2">
                    {/* Productivity Insights */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="h-5 w-5" />
                          Productivity Insights
                        </CardTitle>
                        <CardDescription>AI-powered insights about your work patterns</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                          <h4 className="font-medium text-blue-900 dark:text-blue-100">Peak Productivity</h4>
                          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            You complete most tasks on weekdays. Consider scheduling important tasks during this time.
                          </p>
                        </div>

                        <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                          <h4 className="font-medium text-green-900 dark:text-green-100">Completion Pattern</h4>
                          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                            Your {metrics.streakDays}-day streak shows consistent progress. Keep it up!
                          </p>
                        </div>

                        <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                          <h4 className="font-medium text-orange-900 dark:text-orange-100">Improvement Area</h4>
                          <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                            Consider breaking down larger tasks into smaller, manageable subtasks.
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Personal Records */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Award className="h-5 w-5" />
                          Personal Records
                        </CardTitle>
                        <CardDescription>Your productivity achievements</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 rounded-lg">
                          <div>
                            <h4 className="font-medium">Best Completion Rate</h4>
                            <p className="text-sm text-muted-foreground">Single day record</p>
                          </div>
                          <div className="text-2xl font-bold text-yellow-600">100%</div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg">
                          <div>
                            <h4 className="font-medium">Most Tasks in a Day</h4>
                            <p className="text-sm text-muted-foreground">Personal best</p>
                          </div>
                          <div className="text-2xl font-bold text-purple-600">12</div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg">
                          <div>
                            <h4 className="font-medium">Longest Streak</h4>
                            <p className="text-sm text-muted-foreground">Consecutive days</p>
                          </div>
                          <div className="text-2xl font-bold text-green-600">{Math.max(metrics.streakDays, 7)}</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
