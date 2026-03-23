import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, BarChart3, PieChart, LineChart, AreaChart as AreaChartIcon,
  ChevronDown, ChevronUp, FileText, CheckCircle2, Sparkles, 
  User, X, Download, LayoutDashboard, Settings, Plus, Table2,
  Upload, Server, ArrowRight, Edit3, Save, Trash2, Search,
  Check, AlertCircle, Activity, Clock, ChevronRight, Copy, Code,
  Link2, Maximize2, Minimize2, Calendar, History, Settings2, Database,
  ArrowLeft, ListTree, Play, Pause, RefreshCw, Folder, MoreHorizontal, Share2, CalendarClock
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell,
  LineChart as RechartsLineChart, Line,
  AreaChart, Area
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type ViewMode = 'home' | 'chat' | 'dashboard' | 'datasets' | 'reports';
type DataSource = 'system' | 'excel';
type RightPanelMode = 'data' | 'sql' | 'report' | 'report_wizard' | 'report_management' | 'metadata';

interface ReportSection {
  id: string;
  title: string;
  content: string;
  type?: 'text' | 'chart';
  chartData?: any[];
  chartType?: 'bar' | 'line' | 'pie' | 'area';
}

interface ScheduleConfig {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'once';
  time: string;
  day?: string;
  month?: string;
  weekDay?: string;
  saveToHistory: boolean;
  enabled: boolean;
}

interface Reference {
  id: number;
  source: string;
  description: string;
}

interface ReportHistory {
  id: string;
  createdAt: string;
  summary: string;
  reportData: Report;
}

interface Report {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  tags: string[];
  summary: string;
  sections: ReportSection[];
  references: Reference[];
  chartType: string;
  chartData?: any[];
  createdAt: string;
  type?: 'template' | 'one-time';
  schedule?: string;
  updateCycle?: string;
  scheduleConfig?: ScheduleConfig;
  history?: ReportHistory[];
}

interface AnalysisStep {
  id: string;
  title: string;
  status: 'completed' | 'processing' | 'pending';
  description: string;
  reasoning?: string;
  pythonCode?: string;
  pythonResult?: {
    headers: string[];
    rows: any[][];
  };
  sql?: string;
  resultSummary?: string;
  duration?: string;
}

interface ReportOutlineItem {
  id: string;
  title: string;
  level: number;
  description?: string;
}

interface ReportOutline {
  title: string;
  items: ReportOutlineItem[];
}

interface TableInfo {
  id: string;
  name: string;
  code: string;
  description: string;
  selected: boolean;
  columns?: { name: string, type: string, description: string }[];
}

interface MetricInfo {
  id: string;
  name: string;
  code: string;
  description: string;
  selected: boolean;
  tags?: string[];
  formula?: string;
}

interface SelectedSource {
  id: string;
  name: string;
  type: 'hive' | 'mysql' | 'excel';
}

// --- Demo Data ---
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const SYSTEM_SOURCES: SelectedSource[] = [
  { id: 's1', name: 'test_cec_hive', type: 'hive' },
  { id: 's2', name: 'industry_transportation_mysql', type: 'mysql' },
];

const RECALLED_TABLES: TableInfo[] = [
  { 
    id: '1', 
    name: '事故类型表', 
    code: 'ods_accident_type', 
    description: '包含事故分类、状态、创建时间等基础信息', 
    selected: true,
    columns: [
      { name: 'id', type: 'bigint', description: '主键ID' },
      { name: 'type_name', type: 'string', description: '事故类型名称' },
      { name: 'status', type: 'int', description: '状态(0:禁用, 1:启用)' },
      { name: 'create_time', type: 'timestamp', description: '创建时间' }
    ]
  },
  { 
    id: '2', 
    name: '事故事件类型表', 
    code: 'ods_event_type', 
    description: '详细记录各类事故事件的细分类型及属性', 
    selected: true,
    columns: [
      { name: 'event_id', type: 'bigint', description: '事件ID' },
      { name: 'event_code', type: 'string', description: '事件编码' },
      { name: 'event_name', type: 'string', description: '事件名称' },
      { name: 'category', type: 'string', description: '事件分类' }
    ]
  },
  { 
    id: '3', 
    name: '事故记录表', 
    code: 'ods_accident_record', 
    description: '记录事故发生的具体时间、地点、人员等明细', 
    selected: false,
    columns: [
      { name: 'record_id', type: 'bigint', description: '记录ID' },
      { name: 'accident_time', type: 'timestamp', description: '事故发生时间' },
      { name: 'location', type: 'string', description: '发生地点' },
      { name: 'severity', type: 'string', description: '严重程度' }
    ]
  },
  { 
    id: '4', 
    name: '车辆类型表', 
    code: 'ods_vehicle_type', 
    description: '涉及事故的车辆品牌、型号、载重等数据', 
    selected: false,
    columns: [
      { name: 'vehicle_id', type: 'bigint', description: '车辆ID' },
      { name: 'brand', type: 'string', description: '品牌' },
      { name: 'model', type: 'string', description: '型号' },
      { name: 'load_capacity', type: 'double', description: '载重' }
    ]
  },
];

const RECALLED_METRICS: MetricInfo[] = [
  { id: 'm1', name: '事故发生率', code: 'accident_rate', description: '单位时间内的事故发生频率', selected: false, tags: ['核心指标', '安全'], formula: 'COUNT(accident_id) / COUNT(DISTINCT date)' },
  { id: 'm2', name: '平均处理时长', code: 'avg_handle_time', description: '从事故发生到处理完成的平均时间', selected: false, tags: ['效率', '运营'], formula: 'AVG(finish_time - start_time)' },
  { id: 'm3', name: '重大事故占比', code: 'major_accident_ratio', description: '重大事故在所有事故中的比例', selected: false, tags: ['风险', '监控'], formula: 'COUNT(IF(severity="major", 1, NULL)) / COUNT(*)' },
];

const CHART_DATA = [
  { accident_type: '单车事故', count: 236, ratio: 24.5 },
  { accident_type: '多车事故', count: 236, ratio: 24.5 },
  { accident_type: '危险化学品事故', count: 287, ratio: 27.6 },
  { accident_type: '撞人事故', count: 258, ratio: 23.4 },
];

const ANALYSIS_PROCESS: AnalysisStep[] = [
  {
    id: 'step1',
    title: '计算上季度整体GMV、订单量、参与用户数、活动转化率及同比变化',
    status: 'completed',
    description: '获取上季度整体活动表现指标及同比变化',
    reasoning: `查询问题：计算上季度(2025年Q2)的整体GMV、订单量、参与用户数、活动转化率，以及这些指标与去年同期(2024年Q2)的同比变化。
根据提供的数据的部分内容得出一个初步结论：
在2025年Q2季度(4-6月)的数据中，GMV为5,898,124.80元，订单量为28,896单，参与用户数为1,293,421人，活动转化率为17.97%。由于缺少2024年Q2季度的数据，因此无法计算同比变化率。`,
    pythonCode: `# 导入依赖
import pandas as pd
from typing import Optional

def load_table(table_name: str, column_list: Optional[list] = None):
    """本方法用于获得指定table_name表所有column_list列的数据"""
    pass

# 加载需要的数据列
df = load_table('ods_sales_data', ['gmv', 'order_id', 'user_id', 'event_date'])
# 过滤上季度数据
q2_2025 = df[(df['event_date'] >= '2025-04-01') & (df['event_date'] <= '2025-06-30')]
# 计算指标
gmv = q2_2025['gmv'].sum()
orders = q2_2025['order_id'].nunique()
users = q2_2025['user_id'].nunique()
conversion = orders / users`,
    pythonResult: {
      headers: ['指标', '2025Q2值', '2024Q2值', '同比变化率'],
      rows: [
        ['GMV', '5898124.80', '0', '-'],
        ['订单量', '28896', '0', '-'],
        ['参与用户数', '1293421', '0', '-'],
        ['活动转化率', '0.17966', '0', '-']
      ]
    },
    duration: '1245.2ms'
  },
  {
    id: 'step2',
    title: '深度洞察：分析不同区域及品类的波动归因',
    status: 'pending',
    description: '通过下钻分析识别影响GMV波动的核心因素。'
  }
];

const DEMO_REPORT: Report = {
  id: 'r1',
  title: '新客购买力分层分析报告',
  subtitle: '基于企业销售数据分析新客购买力的分层情况',
  date: '2025-12-11',
  tags: ['销售数据分析'],
  summary: '本报告基于企业销售数据分析新客购买力的分层情况。从数据可以看出，当前新客样本量相对有限，但已展现出明显的购买力特征分布模式。核心发现：所有新客均集中在"中"购买力分层，平均消费金额达到1135.95元，显著高于老客平均水平。',
  sections: [
    {
      id: 's1',
      title: '数据概况与样本分析',
      content: '本次分析基于企业销售数据表，数据采集时间范围为当前可用数据周期。数据集包含客户基本信息、购买行为、营销活动等多维度信息，为新客购买力分层提供了基础数据支撑 [1]。'
    },
    {
      id: 's2',
      title: '短期优化措施',
      content: '1. 重新校准分层模型：立即评估购买力分层标准的准确性和一致性。2. 拓展获客渠道：测试短信、邮件等多种新客获取方式。3. 地域扩张试点：在其他省份复制成功的二线城市营销模式。'
    }
  ],
  references: [
    { id: 1, source: 'new_customer_power_distribution', description: '显示新客购买力分层分布情况' },
    { id: 2, source: 'new_customer_spending', description: '提供新客消费金额统计信息' }
  ],
  chartType: 'pie',
  chartData: CHART_DATA,
  createdAt: '2025-12-11 11:03',
  type: 'template',
  schedule: '每月1日更新',
  history: [
    {
      id: 'h1',
      createdAt: '2025-11-01 00:00',
      summary: '包含12个数据点，新增11月数据',
      reportData: {
        id: 'r1_h1',
        title: '新客购买力分层分析报告',
        subtitle: '基于企业销售数据分析新客购买力的分层情况',
        date: '2025-11-01',
        tags: ['销售数据分析'],
        summary: '本报告基于企业销售数据分析新客购买力的分层情况。从数据可以看出，当前新客样本量相对有限，但已展现出明显的购买力特征分布模式。核心发现：所有新客均集中在"中"购买力分层，平均消费金额达到1135.95元，显著高于老客平均水平。',
        sections: [
          {
            id: 's1_h1',
            title: '数据概况与样本分析',
            content: '本次分析基于企业销售数据表，数据采集时间范围为当前可用数据周期。数据集包含客户基本信息、购买行为、营销活动等多维度信息，为新客购买力分层提供了基础数据支撑 [1]。'
          },
          {
            id: 's2_h1',
            title: '短期优化措施',
            content: '1. 重新校准分层模型：立即评估购买力分层标准的准确性和一致性。2. 拓展获客渠道：测试短信、邮件等多种新客获取方式。3. 地域扩张试点：在其他省份复制成功的二线城市营销模式。'
          }
        ],
        references: [
          { id: 1, source: 'new_customer_power_distribution', description: '显示新客购买力分层分布情况' },
          { id: 2, source: 'new_customer_spending', description: '提供新客消费金额统计信息' }
        ],
        chartType: 'pie',
        createdAt: '2025-11-01 00:00',
        type: 'one-time'
      }
    },
    {
      id: 'h2',
      createdAt: '2025-10-01 00:00',
      summary: '包含10个数据点，初始版本',
      reportData: {
        id: 'r1_h2',
        title: '新客购买力分层分析报告',
        subtitle: '基于企业销售数据分析新客购买力的分层情况',
        date: '2025-10-01',
        tags: ['销售数据分析'],
        summary: '本报告基于企业销售数据分析新客购买力的分层情况。从数据可以看出，当前新客样本量相对有限。核心发现：大部分新客集中在"中"购买力分层，平均消费金额达到980.50元，略高于老客平均水平。',
        sections: [
          {
            id: 's1_h2',
            title: '数据概况与样本分析',
            content: '本次分析基于企业销售数据表，数据采集时间范围为当前可用数据周期。数据集包含客户基本信息、购买行为等信息，为新客购买力分层提供了基础数据支撑 [1]。'
          },
          {
            id: 's2_h2',
            title: '短期优化措施',
            content: '1. 重新校准分层模型：立即评估购买力分层标准的准确性。2. 拓展获客渠道：测试短信等多种新客获取方式。'
          }
        ],
        references: [
          { id: 1, source: 'new_customer_power_distribution', description: '显示新客购买力分层分布情况' },
          { id: 2, source: 'new_customer_spending', description: '提供新客消费金额统计信息' }
        ],
        chartType: 'pie',
        createdAt: '2025-10-01 00:00',
        type: 'one-time'
      }
    }
  ]
};

const DEMO_ONETIME_REPORT: Report = {
  ...DEMO_REPORT,
  id: 'r2',
  title: '618活动复盘',
  subtitle: '2025年618大促活动效果总结',
  date: '2025-06-20',
  type: 'one-time',
  schedule: undefined,
  history: undefined,
  createdAt: '2025-06-20 15:30'
};

// --- Components ---

const HomePage = ({ 
  inputValue, 
  setInputValue, 
  handleSendMessage, 
  selectedSources, 
  setSelectedSources, 
  setShowSourcePicker, 
  isUploading, 
  fileInputRef, 
  handleFileUpload,
  handleStartReportWizard,
  setRightPanelMode,
  setReportWizardStep,
  setWizardTheme,
  setWizardSelectedTables,
  setShowRightPanel
}: {
  inputValue: string;
  setInputValue: (val: string) => void;
  handleSendMessage: (text?: string) => void;
  selectedSources: SelectedSource[];
  setSelectedSources: React.Dispatch<React.SetStateAction<SelectedSource[]>>;
  setShowSourcePicker: (val: boolean) => void;
  isUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleStartReportWizard: () => void;
  setRightPanelMode: (mode: RightPanelMode) => void;
  setReportWizardStep: (step: 1 | 2 | 3) => void;
  setWizardTheme: (theme: string) => void;
  setWizardSelectedTables: (tables: string[]) => void;
  setShowRightPanel: (show: boolean) => void;
}) => (
  <div className="flex-1 flex flex-col items-center justify-center bg-[#f0f4ff] relative overflow-hidden">
    <div className="z-10 flex flex-col items-start max-w-5xl w-full px-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-600/20">
          <MessageSquare size={28} />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
          您好，我是<span className="text-blue-600">数据分析智能助手</span>
        </h1>
      </div>
      
      <p className="text-slate-500 mb-8 font-medium">专注于数据洞察与智能分析和可视化，快速提炼关键洞察，助力高效决策。</p>
      
      {/* Dataset Selection Bar */}
      <div className="flex items-center gap-3 mb-4 w-full">
        <div className="relative">
          <button 
            onClick={() => setShowSourcePicker(true)}
            className="flex items-center justify-between gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-blue-400 transition-all min-w-[180px]"
          >
            <span>{selectedSources.length > 0 ? `已选择 ${selectedSources.length} 个数据集` : '请选择数据集'}</span>
            <ChevronDown size={16} className="text-slate-400" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {selectedSources.map(source => (
            <div key={source.id} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-100 rounded-lg text-xs font-medium text-slate-600 shadow-sm">
              <span>{source.type === 'hive' ? 'Hive' : 'MySQL'}({source.name})</span>
              <button 
                onClick={() => setSelectedSources(prev => prev.filter(s => s.id !== source.id))}
                className="text-slate-300 hover:text-red-500 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {selectedSources.length === 0 && (
            <span className="text-xs text-slate-400 italic py-1.5">未选择时默认使用全部数据集</span>
          )}
        </div>
      </div>

      {/* Large Chat Input Area */}
      <div className="w-full relative group mb-8">
        <div className="relative flex flex-col bg-white border border-slate-200 rounded-3xl shadow-sm focus-within:border-blue-400 focus-within:shadow-xl focus-within:shadow-blue-500/5 transition-all overflow-hidden min-h-[200px]">
          <textarea 
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="输入您的任务描述，使用shift+enter 换行（敏感数据谨慎输入）" 
            className="flex-1 px-8 py-6 bg-transparent outline-none text-lg font-medium placeholder:text-slate-300 resize-none"
          />
          
          <div className="px-6 py-4 flex justify-between items-center bg-white">
            <div className="flex gap-3">
              <button 
                onClick={() => handleSendMessage()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-bold hover:bg-blue-100 transition-all"
              >
                <Database size={14} />
                取数分析
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-500 rounded-full text-xs font-bold hover:bg-slate-100 transition-all"
              >
                <Upload size={14} />
                {isUploading ? '上传中...' : '上传文件'}
              </button>
              <button 
                onClick={handleStartReportWizard}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full text-xs font-bold hover:bg-red-100 transition-all"
              >
                <FileText size={14} />
                智能报告
              </button>
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
            </div>
            
            <button 
              onClick={() => handleSendMessage()}
              className="p-3 bg-blue-600/20 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
            >
              <ArrowRight size={24} />
            </button>
          </div>
        </div>
      </div>
      
      <div className="w-full">
        <p className="text-sm font-medium text-slate-400 mb-4">您可以直接这样问</p>
        <div className="space-y-3">
          {[
            '统计最近半年的四川省交通事故数据',
            '分析危化品运输事故的月度增长趋势',
          ].map((q, i) => (
            <button 
              key={i} 
              onClick={() => handleSendMessage(q)}
              className="flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-blue-600 transition-all group"
            >
              <Sparkles size={16} className="text-blue-400" />
              <span className="text-sm font-medium">{q}</span>
              <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 translate-x-[-4px] group-hover:translate-x-0 transition-all" />
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const ScheduleConfigSelector = ({ config, onChange }: { config: ScheduleConfig, onChange: (newConfig: ScheduleConfig) => void }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
        <div className="space-y-0.5">
          <div className="text-sm font-bold text-slate-800">定时更新</div>
          <div className="text-[10px] text-slate-400">开启后，报告模板中的数据将会按更新频率定时更新</div>
        </div>
        <button 
          onClick={() => onChange({...config, enabled: !config.enabled})}
          className={cn(
            "w-12 h-6 rounded-full relative transition-colors",
            config.enabled ? "bg-blue-600" : "bg-slate-200"
          )}
        >
          <div className={cn(
            "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
            config.enabled ? "right-1" : "left-1"
          )}></div>
        </button>
      </div>

      {config.enabled && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">更新频率</label>
              <div className="relative">
                <select 
                  value={config.frequency}
                  onChange={(e) => onChange({...config, frequency: e.target.value as any})}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none appearance-none pr-10"
                >
                  <option value="yearly">每年</option>
                  <option value="monthly">每月</option>
                  <option value="weekly">每周</option>
                  <option value="daily">每日</option>
                  <option value="once">仅一次</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            
            <div className="flex gap-2 items-end">
              {config.frequency === 'yearly' && (
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">日期</label>
                  <div className="flex gap-1">
                    <select 
                      value={config.month}
                      onChange={(e) => onChange({...config, month: e.target.value})}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none appearance-none"
                    >
                      {Array.from({length: 12}, (_, i) => (i + 1).toString().padStart(2, '0')).map(m => (
                        <option key={m} value={m}>{m}月</option>
                      ))}
                    </select>
                    <select 
                      value={config.day}
                      onChange={(e) => onChange({...config, day: e.target.value})}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none appearance-none"
                    >
                      {Array.from({length: 31}, (_, i) => (i + 1).toString().padStart(2, '0')).map(d => (
                        <option key={d} value={d}>{d}日</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              {config.frequency === 'monthly' && (
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">日期</label>
                  <select 
                    value={config.day}
                    onChange={(e) => onChange({...config, day: e.target.value})}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none appearance-none"
                  >
                    {Array.from({length: 31}, (_, i) => (i + 1).toString().padStart(2, '0')).map(d => (
                      <option key={d} value={d}>{d}日</option>
                    ))}
                  </select>
                </div>
              )}
              {config.frequency === 'weekly' && (
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">周几</label>
                  <select 
                    value={config.weekDay}
                    onChange={(e) => onChange({...config, weekDay: e.target.value})}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none appearance-none"
                  >
                    <option value="1">周一</option>
                    <option value="2">周二</option>
                    <option value="3">周三</option>
                    <option value="4">周四</option>
                    <option value="5">周五</option>
                    <option value="6">周六</option>
                    <option value="7">周日</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">具体时间</label>
            <div className="relative">
              <input 
                type="time" 
                step="1"
                value={config.time}
                onChange={(e) => onChange({...config, time: e.target.value})}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <input 
              type="checkbox" 
              checked={config.saveToHistory}
              onChange={(e) => onChange({...config, saveToHistory: e.target.checked})}
              className="w-4 h-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500" 
            />
            <div className="text-xs font-bold text-blue-700">存到历史报告（定时更新时，同时将AI报告保存为历史报告）</div>
          </div>
        </div>
      )}
    </div>
  );
};

const ChartTypeSelector = ({ selected, onChange }: { selected: string, onChange: (val: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const types = [
    { id: 'bar', icon: <BarChart3 size={16} />, label: '柱状图' },
    { id: 'line', icon: <LineChart size={16} />, label: '折线图' },
    { id: 'pie', icon: <PieChart size={16} />, label: '饼图' },
    { id: 'area', icon: <AreaChartIcon size={16} />, label: '面积图' },
  ];

  return (
    <div className="relative">
      <button 
        className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600 flex items-center gap-1 transition-colors border border-transparent hover:border-gray-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        {types.find(t => t.id === selected)?.icon}
        <ChevronDown size={12} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-full left-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-xl z-20 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {types.map(type => (
              <button
                key={type.id}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors",
                  selected === type.id ? 'text-blue-600 bg-blue-50/50 font-medium' : 'text-gray-700'
                )}
                onClick={() => { onChange(type.id); setIsOpen(false); }}
              >
                {type.icon}
                {type.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};



export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [dataSource, setDataSource] = useState<DataSource>('system');
  const [selectedSources, setSelectedSources] = useState<SelectedSource[]>([]);
  const [defaultSources, setDefaultSources] = useState<SelectedSource[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [activeReport, setActiveReport] = useState<Report | null>(DEMO_REPORT);
  const [savedReports, setSavedReports] = useState<Report[]>([DEMO_REPORT]);
  const [chartType, setChartType] = useState('pie');
  const [tables, setTables] = useState<TableInfo[]>(RECALLED_TABLES);
  const [metrics, setMetrics] = useState<MetricInfo[]>(RECALLED_METRICS);
  const [recallTab, setRecallTab] = useState<'tables' | 'metrics'>('tables');
  const [previewMetadata, setPreviewMetadata] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [isDefaultSourceMode, setIsDefaultSourceMode] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [rightPanelMode, setRightPanelMode] = useState<RightPanelMode>('data');
  const [isEditingReport, setIsEditingReport] = useState(false);
  const [isEditingData, setIsEditingData] = useState(false);
  const [expandedProcessIndex, setExpandedProcessIndex] = useState<number | null>(null);
  const [reportOutline, setReportOutline] = useState<ReportOutline | null>(null);
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [isEditingOutline, setIsEditingOutline] = useState(false);
  const [editingOutline, setEditingOutline] = useState<ReportOutline | null>(null);
  const [showReportOptionsIndex, setShowReportOptionsIndex] = useState<number | null>(null);
  const [isFullscreenReport, setIsFullscreenReport] = useState(false);
  const [reportWizardStep, setReportWizardStep] = useState<1 | 2 | 3>(1);
  const [wizardTheme, setWizardTheme] = useState('');
  const [wizardSelectedSource, setWizardSelectedSource] = useState<SelectedSource | null>(null);
  const [wizardSelectedTables, setWizardSelectedTables] = useState<string[]>([]);
  const [generationTasks, setGenerationTasks] = useState<{label: string, status: 'waiting' | 'running' | 'success'}[]>([
    { label: '数据提取', status: 'waiting' },
    { label: '图表绘制', status: 'waiting' },
    { label: '结论撰写', status: 'waiting' },
    { label: '排版优化', status: 'waiting' }
  ]);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>({
    frequency: 'daily',
    time: '00:00:00',
    day: '01',
    month: '01',
    weekDay: '1',
    saveToHistory: true,
    enabled: true
  });
  const [showDataPointModal, setShowDataPointModal] = useState(false);
  const [reports, setReports] = useState<Report[]>([DEMO_REPORT, DEMO_ONETIME_REPORT]);
  const [reportFilter, setReportFilter] = useState<'all' | 'template' | 'one-time'>('all');
  const [reportSearchQuery, setReportSearchQuery] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState<string | null>(null);
  const [compareVersions, setCompareVersions] = useState<string[]>([]);
  const [showCompareView, setShowCompareView] = useState(false);
  const [showSaveReportDrawer, setShowSaveReportDrawer] = useState(false);
  const [reportToSave, setReportToSave] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize with default sources if any
  useEffect(() => {
    if (defaultSources.length > 0 && selectedSources.length === 0) {
      setSelectedSources(defaultSources);
    }
  }, [defaultSources]);

  // Auto-advance countdown for recall message
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.type === 'recall' && lastMsg.countdown !== undefined && lastMsg.countdown > 0) {
      const timer = setTimeout(() => {
        setMessages(prev => {
          const newMsgs = [...prev];
          const msg = { ...newMsgs[newMsgs.length - 1] };
          if (msg.type === 'recall' && msg.countdown !== undefined) {
            msg.countdown -= 1;
            newMsgs[newMsgs.length - 1] = msg;
          }
          return newMsgs;
        });
      }, 1000);
      return () => clearTimeout(timer);
    } else if (lastMsg?.type === 'recall' && lastMsg.countdown === 0) {
      handleConfirmTables();
      // Clear the countdown so it doesn't trigger again
      setMessages(prev => {
        const newMsgs = [...prev];
        const msg = { ...newMsgs[newMsgs.length - 1] };
        if (msg.type === 'recall') {
          msg.countdown = undefined;
          newMsgs[newMsgs.length - 1] = msg;
        }
        return newMsgs;
      });
    }
  }, [messages]);

  const handleSendMessage = (text?: string) => {
    const query = text || inputValue;
    if (!query.trim()) return;

    if (viewMode === 'home') setViewMode('chat');
    
    setMessages(prev => [...prev, { type: 'user', content: query }]);
    setInputValue('');

    // Check if it's a report request
    const isReportRequest = query.includes('报告') || query.includes('分析报');

    if (isReportRequest) {
      setIsGeneratingOutline(true);
      setTimeout(() => {
        setIsGeneratingOutline(false);
        const outline: ReportOutline = {
          title: '深度研究报告：' + query,
          items: [
            { id: '1', title: '1. 问题定义与背景分析', level: 1, description: '明确分析目标，梳理业务背景及核心痛点。' },
            { id: '2', title: '2. 数据探索与假设验证', level: 1, description: '基于现有数据集进行多维探索，验证业务假设。' },
            { id: '2.1', title: '2.1 核心指标波动分析', level: 2 },
            { id: '2.2', title: '2.2 区域/品类下钻洞察', level: 2 },
            { id: '3', title: '3. 结论推导与归因分析', level: 1, description: '结合数据洞察，推导核心结论并进行深度归因。' },
            { id: '4', title: '4. 决策建议与行动方案', level: 1, description: '基于分析结论，提出可落地的业务改进建议。' },
          ]
        };
        setReportOutline(outline);
        setMessages(prev => [...prev, { 
          type: 'report_outline', 
          content: '已为您构建「问题定义→假设验证→结论推导」的分析路径，生成分析大纲如下：',
          outline: outline
        }]);
      }, 1500);
      return;
    }

    // Simulate Recall Logic
    setTimeout(() => {
      // Scenario Simulation: If query contains "error" or "none", simulate failed recall
      const isFailedRecall = query.includes('错误') || query.includes('没有') || query.toLowerCase().includes('fail');
      
      if (isFailedRecall) {
        setMessages(prev => [...prev, { 
          type: 'recall_failed', 
          content: '抱歉，系统未能根据您的提问自动匹配到相关数据表。' 
        }]);
      } else {
        setMessages(prev => [...prev, { 
          type: 'recall', 
          content: '根据您的分析诉求，系统为您召回了以下相关数据表。请确认或手动勾选参与分析的表：',
          countdown: 5
        }]);
      }
    }, 800);
  };

  const handleUpdateWizardOutline = (msgIdx: number, itemIdx: number, field: 'title' | 'description', value: string) => {
    setMessages(prev => {
      const newMessages = [...prev];
      const msg = { ...newMessages[msgIdx] };
      if (msg.type === 'report_wizard_outline') {
        const newOutline = [...msg.outline];
        newOutline[itemIdx] = { ...newOutline[itemIdx], [field]: value };
        msg.outline = newOutline;
        newMessages[msgIdx] = msg;
      }
      return newMessages;
    });
  };

  const handleAddWizardOutlineItem = (msgIdx: number) => {
    setMessages(prev => {
      const newMessages = [...prev];
      const msg = { ...newMessages[msgIdx] };
      if (msg.type === 'report_wizard_outline') {
        const newOutline = [...msg.outline, { title: '新章节', description: '请输入章节描述...' }];
        msg.outline = newOutline;
        newMessages[msgIdx] = msg;
      }
      return newMessages;
    });
  };

  const handleDeleteWizardOutlineItem = (msgIdx: number, itemIdx: number) => {
    setMessages(prev => {
      const newMessages = [...prev];
      const msg = { ...newMessages[msgIdx] };
      if (msg.type === 'report_wizard_outline') {
        const newOutline = msg.outline.filter((_: any, i: number) => i !== itemIdx);
        msg.outline = newOutline;
        newMessages[msgIdx] = msg;
      }
      return newMessages;
    });
  };

  const startReportGeneration = (outline?: { title: string, description: string }[]) => {
    setReportWizardStep(3);
    setGenerationProgress(0);
    setGenerationTasks([
      { label: '数据提取', status: 'running' },
      { label: '图表绘制', status: 'waiting' },
      { label: '结论撰写', status: 'waiting' },
      { label: '排版优化', status: 'waiting' }
    ]);

    // Add a progress message to the chat
    setMessages(prev => [...prev, { 
      type: 'report_wizard_progress', 
      content: '正在生成报告...',
      tasks: [
        { label: '数据提取', status: 'running' },
        { label: '图表绘制', status: 'waiting' },
        { label: '结论撰写', status: 'waiting' },
        { label: '排版优化', status: 'waiting' }
      ],
      progress: 0
    }]);

    // Step 1: Data Extraction
    setTimeout(() => {
      setGenerationProgress(25);
      setGenerationTasks(prev => [
        { ...prev[0], status: 'success' },
        { ...prev[1], status: 'running' },
        prev[2],
        prev[3]
      ]);
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg.type === 'report_wizard_progress') {
          const newTasks = [...lastMsg.tasks];
          newTasks[0].status = 'success';
          newTasks[1].status = 'running';
          return [...prev.slice(0, -1), { ...lastMsg, tasks: newTasks, progress: 25 }];
        }
        return prev;
      });

      // Step 2: Chart Generation
      setTimeout(() => {
        setGenerationProgress(50);
        setGenerationTasks(prev => [
          prev[0],
          { ...prev[1], status: 'success' },
          { ...prev[2], status: 'running' },
          prev[3]
        ]);
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg.type === 'report_wizard_progress') {
            const newTasks = [...lastMsg.tasks];
            newTasks[1].status = 'success';
            newTasks[2].status = 'running';
            return [...prev.slice(0, -1), { ...lastMsg, tasks: newTasks, progress: 50 }];
          }
          return prev;
        });

        // Step 3: Conclusion Writing
        setTimeout(() => {
          setGenerationProgress(75);
          setGenerationTasks(prev => [
            prev[0],
            prev[1],
            { ...prev[2], status: 'success' },
            { ...prev[3], status: 'running' }
          ]);
          setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg.type === 'report_wizard_progress') {
              const newTasks = [...lastMsg.tasks];
              newTasks[2].status = 'success';
              newTasks[3].status = 'running';
              return [...prev.slice(0, -1), { ...lastMsg, tasks: newTasks, progress: 75 }];
            }
            return prev;
          });

          // Step 4: Layout Optimization
          setTimeout(() => {
            setGenerationProgress(100);
            setGenerationTasks(prev => [
              prev[0],
              prev[1],
              prev[2],
              { ...prev[3], status: 'success' }
            ]);
            setMessages(prev => {
              const lastMsg = prev[prev.length - 1];
              if (lastMsg.type === 'report_wizard_progress') {
                const newTasks = [...lastMsg.tasks];
                newTasks[3].status = 'success';
                return [...prev.slice(0, -1), { ...lastMsg, tasks: newTasks, progress: 100 }];
              }
              return prev;
            });
            
            // Generate the final report
            const newReport: Report = {
              ...DEMO_REPORT,
              id: Math.random().toString(36).substr(2, 9),
              title: wizardTheme || '智能分析报告',
              summary: '基于所选数据集生成的智能分析报告。报告涵盖了数据提取、图表分析及核心结论。',
              sections: outline ? outline.map(item => ({
                id: Math.random().toString(36).substr(2, 9),
                title: item.title,
                content: `针对“${item.title}”的深度分析：${item.description}。根据AI模型对所选数据表的扫描，该章节展示了关键指标的波动趋势及其背后的驱动因素。`
              })) : DEMO_REPORT.sections,
              createdAt: new Date().toLocaleString(),
              type: 'one-time',
              schedule: undefined,
              history: undefined
            };
            setActiveReport(newReport);
            setReports(prev => [newReport, ...prev]);
            
            // Add completion message
            setMessages(prev => [...prev, { 
              type: 'report_wizard_complete', 
              content: '报告生成成功！以下是您的分析报告：',
              reportId: newReport.id
            }]);
          }, 1500);
        }, 2000);
      }, 1500);
    }, 1000);
  };

  const handleStartReportWizard = () => {
    setViewMode('chat');
    setMessages(prev => [...prev, { 
      type: 'report_wizard_init', 
      content: '您好！我是您的智能报告向导。我将协助您完成一份深度分析报告。首先，请告诉我这份报告的主题或您想分析的核心问题。' 
    }]);
  };

  const handleConfirmTables = () => {
    setIsAnalyzing(true);
    setMessages(prev => [...prev, { type: 'ai_steps', content: '正在处理...' }]);
    
    // Simulate Step 2: Analysis
    setTimeout(() => {
      setIsAnalyzing(false);
      const isDeepResearch = reportOutline !== null;
      const resultText = isDeepResearch 
        ? '深度研究分析完成。通过对上季度GMV的拆解分析，我们发现华东区域的电子品类波动是核心归因点，建议针对该细分市场进行策略优化。'
        : '分析完成。危险化学品事故占比最高（27.6%），建议加强专项预防。';
      
      const mockDataBlocks = [
        {
          title: '事故类型分布',
          columns: ['事故类型', '发生次数', '占比'],
          rows: [
            ['危险化学品', '128', '27.6%'],
            ['交通事故', '96', '20.7%'],
            ['火灾爆炸', '85', '18.3%'],
            ['机械伤害', '64', '13.8%'],
            ['其他', '91', '19.6%']
          ],
          sql: `SELECT accident_type, COUNT(*) as count, ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM ods_accident_record), 2) as ratio FROM ods_accident_record GROUP BY accident_type ORDER BY count DESC;`,
          showSql: false,
          showChart: false
        },
        {
          title: '各区域事故统计',
          columns: ['区域', '事故总数', '环比增长'],
          rows: [
            ['华东区', '156', '+5.2%'],
            ['华南区', '112', '-2.1%'],
            ['华北区', '98', '+1.5%'],
            ['西南区', '65', '-4.3%'],
            ['西北区', '33', '0.0%']
          ],
          sql: `SELECT region, COUNT(*) as total, ROUND((COUNT(*) - prev_count) * 100.0 / prev_count, 2) as growth FROM region_stats GROUP BY region;`,
          showSql: false,
          showChart: false
        }
      ];

      // Create a new report based on the analysis
      const newReport: Report = {
        ...DEMO_REPORT,
        id: Math.random().toString(36).substr(2, 9),
        title: isDeepResearch ? reportOutline.title : '事故分析报告 - ' + new Date().toLocaleDateString(),
        summary: resultText,
        sections: isDeepResearch ? [
          { id: 's1_deep', title: '1. 核心结论', content: '上季度整体业务保持稳健，但局部区域出现波动。核心归因于供应链调整导致的短期缺货。' },
          { id: 's2_deep', title: '2. 多维波动归因', content: '通过对不同区域（华东、华南、华北）及品类（电子、服装、食品）的交叉分析，识别出华东区域电子品类贡献了60%的负向波动。' },
          { id: 's3_deep', title: '3. 决策建议', content: '建议立即启动备选供应商计划，并针对华东区域开展专项促销活动以对冲波动影响。' }
        ] : DEMO_REPORT.sections,
        createdAt: new Date().toLocaleString(),
        type: 'one-time',
        schedule: undefined,
        history: undefined
      };
      
      setReports(prev => [newReport, ...prev]);

      setMessages(prev => {
        const newMsgs = [...prev];
        if (isDeepResearch) {
          newMsgs[newMsgs.length - 1] = { 
            type: 'report_wizard_complete', 
            content: '报告生成成功！以下是您的分析报告：',
            reportId: newReport.id
          };
        } else {
          newMsgs[newMsgs.length - 1] = { 
            type: 'analysis_result', 
            content: resultText,
            hasProcess: true,
            activeAnalysis: null, // null, 'insight', or 'yoy'
            dataBlocks: mockDataBlocks
          };
        }
        return newMsgs;
      });
      
      setActiveReport(newReport);
      setIsEditingReport(false);
      
      // Reset outline after use
      if (isDeepResearch) setReportOutline(null);
    }, 2000);
  };

  const demoSql = `SELECT 
  accident_type, 
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM ods_accident_record), 2) as ratio
FROM ods_accident_record
GROUP BY accident_type
ORDER BY count DESC;`;

  const handleSaveReport = (reportData: Report) => {
    setSavedReports(prev => {
      const exists = prev.find(r => r.id === reportData.id);
      if (exists) {
        return prev.map(r => r.id === reportData.id ? reportData : r);
      }
      return [reportData, ...prev];
    });
    setIsEditingReport(false);
    alert('报告已保存');
  };

  const openReport = (report: Report) => {
    setActiveReport(report);
    setChartType(report.chartType);
    setRightPanelMode('report');
    setShowRightPanel(true);
    setIsEditingReport(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      setTimeout(() => {
        setIsUploading(false);
        setDataSource('excel');
        handleSendMessage(`分析上传的文件: ${e.target.files?.[0].name}`);
      }, 1500);
    }
  };

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden text-slate-900">
      {/* Sidebar */}
      <div className="w-20 bg-slate-900 flex flex-col items-center py-8 text-slate-400 gap-8 z-30">
        <div 
          className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-900/50 cursor-pointer hover:scale-105 transition-transform"
          onClick={() => setViewMode('home')}
        >
          <Sparkles size={24} />
        </div>
        <button 
          className={cn("p-4 rounded-2xl transition-all", viewMode === 'chat' ? "bg-slate-800 text-white shadow-inner" : "hover:bg-slate-800 hover:text-white")}
          onClick={() => setViewMode('chat')}
        >
          <MessageSquare size={24} />
        </button>
        <button 
          className={cn("p-4 rounded-2xl transition-all", viewMode === 'dashboard' ? "bg-slate-800 text-white shadow-inner" : "hover:bg-slate-800 hover:text-white")}
          onClick={() => setViewMode('dashboard')}
        >
          <LayoutDashboard size={24} />
        </button>
        <button 
          className={cn("p-4 rounded-2xl transition-all", viewMode === 'datasets' ? "bg-slate-800 text-white shadow-inner" : "hover:bg-slate-800 hover:text-white")}
          onClick={() => setViewMode('datasets')}
        >
          <Database size={24} />
        </button>
        <button 
          className={cn("p-4 rounded-2xl transition-all", viewMode === 'reports' ? "bg-slate-800 text-white shadow-inner" : "hover:bg-slate-800 hover:text-white")}
          onClick={() => setViewMode('reports')}
          title="我的报告"
        >
          <Folder size={24} />
        </button>
        <button 
          className="p-4 rounded-2xl transition-all hover:bg-slate-800 hover:text-white relative group"
          onClick={() => {
            setIsDefaultSourceMode(true);
            setShowSourcePicker(true);
          }}
          title="绑定默认数据源"
        >
          <Link2 size={24} />
          <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50">
            绑定默认数据源
          </div>
        </button>
        <div className="mt-auto">
          <button className="p-4 hover:bg-slate-800 hover:text-white rounded-2xl transition-all">
            <Settings size={24} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        {viewMode === 'home' ? (
          <HomePage 
            inputValue={inputValue}
            setInputValue={setInputValue}
            handleSendMessage={handleSendMessage}
            selectedSources={selectedSources}
            setSelectedSources={setSelectedSources}
            setShowSourcePicker={setShowSourcePicker}
            isUploading={isUploading}
            fileInputRef={fileInputRef}
            handleFileUpload={handleFileUpload}
            handleStartReportWizard={handleStartReportWizard}
            setRightPanelMode={setRightPanelMode}
            setReportWizardStep={setReportWizardStep}
            setWizardTheme={setWizardTheme}
            setWizardSelectedTables={setWizardSelectedTables}
            setShowRightPanel={setShowRightPanel}
          />
        ) : viewMode === 'dashboard' ? (
          <div className="flex-1 p-12 bg-slate-50 overflow-y-auto">
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-between items-end mb-12">
                <div>
                  <h1 className="text-4xl font-black text-slate-900 mb-2">数据看板</h1>
                  <p className="text-slate-500 font-medium">查看您的核心业务指标和分析概览</p>
                </div>
                <button className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all">
                  <Plus size={20} /> 新建看板
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                {[
                  { label: '总事故数', value: '1,017', trend: '+12.5%', color: 'blue' },
                  { label: '危化品事故', value: '287', trend: '+5.2%', color: 'amber' },
                  { label: '处理成功率', value: '94.2%', trend: '+2.1%', color: 'emerald' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-4">{stat.label}</p>
                    <div className="flex items-end justify-between">
                      <h2 className="text-4xl font-black text-slate-900">{stat.value}</h2>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-black",
                        stat.color === 'blue' ? "bg-blue-50 text-blue-600" : 
                        stat.color === 'amber' ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                      )}>{stat.trend}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm h-[400px]">
                  <h3 className="font-bold text-slate-800 mb-6">事故类型分布</h3>
                  <ResponsiveContainer width="100%" height="85%">
                    <RechartsPieChart>
                      <Pie data={CHART_DATA} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="count">
                        {CHART_DATA.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm h-[400px]">
                  <h3 className="font-bold text-slate-800 mb-6">月度趋势分析</h3>
                  <ResponsiveContainer width="100%" height="85%">
                    <BarChart data={CHART_DATA}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="accident_type" hide />
                      <YAxis hide />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        ) : viewMode === 'datasets' ? (
          <div className="flex-1 p-12 bg-slate-50 overflow-y-auto">
             <div className="max-w-6xl mx-auto">
              <div className="flex justify-between items-end mb-12">
                <div>
                  <h1 className="text-4xl font-black text-slate-900 mb-2">数据集管理</h1>
                  <p className="text-slate-500 font-medium">管理您的数据源、表结构和元数据</p>
                </div>
                <div className="flex gap-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="搜索数据集..." 
                      className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                    />
                  </div>
                  <button className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all">
                    <Plus size={20} /> 添加数据源
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">表名称</th>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">表编码</th>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">数据量</th>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">更新时间</th>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {RECALLED_TABLES.map((table, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                              <Table2 size={20} />
                            </div>
                            <span className="font-bold text-slate-700">{table.name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-500">{table.code}</code>
                        </td>
                        <td className="px-8 py-6 font-medium text-slate-600">12,458 条</td>
                        <td className="px-8 py-6 text-slate-400 text-sm">2024-03-16 14:30</td>
                        <td className="px-8 py-6 text-right">
                          <button className="p-2 text-slate-300 hover:text-blue-600 transition-colors">
                            <Edit3 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
             </div>
          </div>
        ) : viewMode === 'reports' ? (
          <div className="flex-1 p-12 bg-slate-50 overflow-y-auto relative">
            <div className="max-w-6xl mx-auto">
              {/* Header */}
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h1 className="text-4xl font-black text-slate-900 mb-2">我的报告</h1>
                  <p className="text-slate-500 font-medium">集中存储您所有历史生成的报告及模板</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="搜索报告名称..." 
                      value={reportSearchQuery}
                      onChange={e => setReportSearchQuery(e.target.value)}
                      className="pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold w-64 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                  </div>
                  <button className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2">
                    <Plus size={18} /> 新建报告
                  </button>
                </div>
              </div>
              
              {/* Filter Tabs */}
              <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm mb-8 inline-flex">
                {[
                  { id: 'all', label: `全部报告 (${reports.length})` },
                  { id: 'template', label: `模板 (${reports.filter(r => r.type === 'template').length})` },
                  { id: 'one-time', label: `一次性报告 (${reports.filter(r => r.type === 'one-time').length})` }
                ].map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => setReportFilter(tab.id as any)}
                    className={cn(
                      "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                      reportFilter === tab.id ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Report List */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">名称</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">类型</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">最后更新</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reports
                      .filter(r => reportFilter === 'all' || r.type === reportFilter)
                      .filter(r => r.title.toLowerCase().includes(reportSearchQuery.toLowerCase()))
                      .map(report => (
                      <tr key={report.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-5">
                          <button 
                            onClick={() => openReport(report)}
                            className="text-base font-bold text-slate-800 hover:text-blue-600 transition-colors text-left flex items-center gap-3"
                          >
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                              <FileText size={16} />
                            </div>
                            {report.title}
                          </button>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col items-start gap-1">
                            <span className={cn(
                              "px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest",
                              report.type === 'template' ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"
                            )}>
                              {report.type === 'template' ? '模板' : '一次性'}
                            </span>
                            {report.type === 'template' && report.schedule && (
                              <div className="flex items-center gap-1 text-xs font-bold text-slate-400 mt-1">
                                <Clock size={12} /> {report.schedule}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-sm font-bold text-slate-600">{report.createdAt}</div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {report.type === 'template' && report.history && (
                              <button 
                                onClick={() => setShowHistoryModal(report.id)}
                                className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 mr-2"
                              >
                                <History size={14} /> 历史版本 ({report.history.length})
                              </button>
                            )}
                            <button onClick={() => openReport(report)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="查看">
                              <Maximize2 size={18} />
                            </button>
                            <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="编辑">
                              <Edit3 size={18} />
                            </button>
                            <div className="relative group/more">
                              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all" title="更多">
                                <MoreHorizontal size={18} />
                              </button>
                              <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-xl border border-slate-100 opacity-0 invisible group-hover/more:opacity-100 group-hover/more:visible transition-all z-10 py-1">
                                <button className="w-full px-4 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2">
                                  <Share2 size={14} /> 分享报告
                                </button>
                                <button 
                                  onClick={() => {
                                    setActiveReport(report);
                                    setShowScheduleModal(true);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2"
                                >
                                  <CalendarClock size={14} /> 设置定时更新
                                </button>
                                <div className="h-px bg-slate-100 my-1"></div>
                                <button className="w-full px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2">
                                  <Trash2 size={14} /> 删除报告
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {reports.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                          暂无报告数据
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* History Modal */}
            {showHistoryModal && (
              <div className="absolute inset-0 z-50 flex justify-end">
                <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setShowHistoryModal(null)}></div>
                <div className="relative w-[600px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right-8 duration-300">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                      <h2 className="text-xl font-black text-slate-800">历史版本</h2>
                      <p className="text-sm text-slate-500 mt-1">
                        {reports.find(r => r.id === showHistoryModal)?.title}
                      </p>
                    </div>
                    <button onClick={() => setShowHistoryModal(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-4">
                      {reports.find(r => r.id === showHistoryModal)?.history?.map((hist, idx) => (
                        <div key={hist.id} className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all bg-white flex items-start gap-4 group">
                          <div className="pt-1">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              checked={compareVersions.includes(hist.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  if (compareVersions.length < 2) {
                                    setCompareVersions([...compareVersions, hist.id]);
                                  }
                                } else {
                                  setCompareVersions(compareVersions.filter(id => id !== hist.id));
                                }
                              }}
                              disabled={!compareVersions.includes(hist.id) && compareVersions.length >= 2}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                              <div className="font-bold text-slate-800 flex items-center gap-2">
                                {hist.createdAt}
                                {idx === 0 && <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-md">最新</span>}
                              </div>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => {
                                    openReport({...hist.reportData, type: 'history'});
                                    setShowHistoryModal(null);
                                  }}
                                  className="text-xs font-bold text-blue-600 hover:text-blue-700"
                                >
                                  查看
                                </button>
                                <button 
                                  onClick={() => {
                                    if (compareVersions.includes(hist.id)) {
                                      setCompareVersions(compareVersions.filter(id => id !== hist.id));
                                    } else if (compareVersions.length < 2) {
                                      setCompareVersions([...compareVersions, hist.id]);
                                    }
                                  }}
                                  className={cn("text-xs font-bold", compareVersions.includes(hist.id) ? "text-indigo-600 hover:text-indigo-700" : "text-slate-500 hover:text-slate-700")}
                                >
                                  {compareVersions.includes(hist.id) ? "取消对比" : "加入对比"}
                                </button>
                                <button className="text-xs font-bold text-red-500 hover:text-red-700">删除</button>
                              </div>
                            </div>
                            <p className="text-sm text-slate-500">{hist.summary}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                    <div className="text-sm font-bold text-slate-500">
                      已选择 {compareVersions.length}/2 个版本
                    </div>
                    <button 
                      disabled={compareVersions.length !== 2}
                      onClick={() => setShowCompareView(true)}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-600/20"
                    >
                      对比所选版本
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Compare View Modal */}
            {showCompareView && (
              <div className="fixed inset-0 z-[60] bg-slate-50 flex flex-col animate-in slide-in-from-bottom-8 duration-300">
                <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setShowCompareView(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                      <ArrowLeft size={20} />
                    </button>
                    <div>
                      <h2 className="text-lg font-black text-slate-800">版本对比</h2>
                      <p className="text-xs text-slate-500">对比两个历史版本的数据差异</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">
                      导出对比结果
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 flex overflow-hidden">
                  {(() => {
                    const template = reports.find(r => r.id === showHistoryModal);
                    const versionA = template?.history?.find(h => h.id === compareVersions[0]);
                    const versionB = template?.history?.find(h => h.id === compareVersions[1]);
                    const reportA = versionA?.reportData;
                    const reportB = versionB?.reportData;
                    
                    if (!reportA || !reportB) return null;
                    
                    return (
                      <>
                        {/* Left Version */}
                        <div className="flex-1 border-r border-slate-200 flex flex-col bg-white">
                          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                            <div className="text-sm font-bold text-slate-800">版本 A: {versionA.createdAt}</div>
                          </div>
                          <div className="flex-1 overflow-y-auto p-8">
                            <div className="max-w-2xl mx-auto space-y-8">
                              <div className="space-y-2">
                                <h1 className="text-3xl font-black text-slate-900">{reportA.title}</h1>
                                <p className="text-slate-500">{reportA.subtitle}</p>
                              </div>
                              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                <h3 className="font-bold text-slate-800 mb-2">核心摘要</h3>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                  {reportA.summary}
                                </p>
                              </div>
                              {reportA.sections.map((sec, i) => (
                                <div key={i} className="space-y-4">
                                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                                    {sec.title}
                                  </h3>
                                  <div className="text-slate-600 leading-relaxed text-sm">
                                    {sec.content}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        {/* Right Version */}
                        <div className="flex-1 flex flex-col bg-white">
                          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                            <div className="text-sm font-bold text-slate-800">版本 B: {versionB.createdAt}</div>
                          </div>
                          <div className="flex-1 overflow-y-auto p-8">
                            <div className="max-w-2xl mx-auto space-y-8">
                              <div className="space-y-2">
                                <h1 className="text-3xl font-black text-slate-900">{reportB.title}</h1>
                                <p className="text-slate-500">{reportB.subtitle}</p>
                              </div>
                              <div className={cn("p-6 rounded-2xl border relative", reportA.summary !== reportB.summary ? "bg-blue-50/50 border-blue-100" : "bg-slate-50 border-slate-100")}>
                                {reportA.summary !== reportB.summary && <div className="absolute top-2 right-2 px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-bold rounded">已修改</div>}
                                <h3 className="font-bold text-slate-800 mb-2">核心摘要</h3>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                  {reportA.summary !== reportB.summary ? (
                                    <>
                                      <span className="bg-red-100 text-red-800 line-through px-1 rounded mr-1">{reportA.summary.replace(reportB.summary, '')}</span>
                                      <span className="bg-emerald-100 text-emerald-800 px-1 rounded">{reportB.summary}</span>
                                    </>
                                  ) : reportB.summary}
                                </p>
                              </div>
                              {reportB.sections.map((sec, i) => {
                                const secA = reportA.sections.find(s => s.title === sec.title);
                                const isModified = secA && secA.content !== sec.content;
                                const isNew = !secA;
                                
                                return (
                                  <div key={i} className={cn("space-y-4 p-4 rounded-xl relative", isModified ? "bg-amber-50/50" : isNew ? "bg-emerald-50/50" : "")}>
                                    {isModified && <div className="absolute top-2 right-2 px-2 py-0.5 bg-amber-100 text-amber-600 text-[10px] font-bold rounded">已修改</div>}
                                    {isNew && <div className="absolute top-2 right-2 px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[10px] font-bold rounded">新增</div>}
                                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                      <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                                      {sec.title}
                                    </h3>
                                    <div className="text-slate-600 leading-relaxed text-sm">
                                      {isModified ? (
                                        <>
                                          <span className="bg-red-100 text-red-800 line-through px-1 rounded mr-1">{secA.content}</span>
                                          <span className="bg-emerald-100 text-emerald-800 px-1 rounded">{sec.content}</span>
                                        </>
                                      ) : sec.content}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="h-16 border-b border-slate-100 bg-white flex items-center px-8 justify-between z-10">
              <div className="flex items-center gap-3">
                <h1 className="font-black text-lg text-slate-900">智能分析会话</h1>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100">Online</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                  <Server size={14} />
                  {dataSource === 'system' ? '生产数据库' : '本地文件'}
                </div>
                <button className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                  <Plus size={20} />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-8 space-y-12 pb-40">
              <div className="max-w-5xl mx-auto">
                {messages.map((msg, idx) => (
                  <div key={idx} className={cn("flex gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500", msg.type === 'user' ? "flex-row-reverse" : "")}>
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                      msg.type === 'user' ? "bg-slate-100 text-slate-500 border border-slate-200" : "bg-blue-600 text-white"
                    )}>
                      {msg.type === 'user' ? <User size={24} /> : <Sparkles size={24} />}
                    </div>
                    
                    <div className={cn("flex-1 max-w-4xl", msg.type === 'user' ? "flex justify-end" : "")}>
                      {msg.type === 'user' ? (
                        <div className="bg-slate-900 text-white px-6 py-4 rounded-3xl rounded-tr-sm shadow-xl font-medium text-lg">
                          {msg.content}
                        </div>
                      ) : msg.type === 'report_wizard_init' ? (
                        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden animate-in zoom-in-95">
                          <div className="p-8">
                            <div className="flex items-center gap-3 mb-6">
                              <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                                <FileText size={20} />
                              </div>
                              <h3 className="text-xl font-bold text-slate-800">智能报告向导</h3>
                            </div>
                            <p className="text-slate-700 font-medium mb-8 text-lg leading-relaxed">{msg.content}</p>
                            
                            <div className="space-y-6">
                              <div className="space-y-3">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">报告主题</label>
                                <input 
                                  type="text"
                                  value={wizardTheme}
                                  onChange={e => setWizardTheme(e.target.value)}
                                  placeholder="例如：2025年第一季度事故分析报告"
                                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 font-medium transition-all"
                                />
                              </div>
                              
                              <div className="space-y-3">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">选择参与分析的数据表</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {RECALLED_TABLES.map(table => (
                                    <div 
                                      key={table.id}
                                      onClick={() => {
                                        if (wizardSelectedTables.includes(table.name)) {
                                          setWizardSelectedTables(prev => prev.filter(t => t !== table.name));
                                        } else {
                                          setWizardSelectedTables(prev => [...prev, table.name]);
                                        }
                                      }}
                                      className={cn(
                                        "p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between",
                                        wizardSelectedTables.includes(table.name) ? "bg-blue-50 border-blue-500 shadow-md" : "bg-white border-slate-100 hover:border-slate-300"
                                      )}
                                    >
                                      <div className="flex flex-col">
                                        <span className={cn("font-bold text-sm", wizardSelectedTables.includes(table.name) ? "text-blue-700" : "text-slate-700")}>{table.name}</span>
                                        <span className="text-[10px] font-mono text-slate-400">{table.code}</span>
                                      </div>
                                      <div className={cn(
                                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                        wizardSelectedTables.includes(table.name) ? "bg-blue-600 border-blue-600 text-white" : "border-slate-200 bg-white"
                                      )}>
                                        {wizardSelectedTables.includes(table.name) && <Check size={12} />}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
                            <button 
                              onClick={() => {
                                setMessages(prev => [...prev, { 
                                  type: 'report_wizard_outline', 
                                  content: '根据您的需求，我为您规划了以下报告大纲：',
                                  outline: [
                                    { title: '1. 数据概览', description: '展示所选数据集的基础统计信息。' },
                                    { title: '2. 核心指标分析', description: '针对关键业务指标进行多维度拆解。' },
                                    { title: '3. 异常点检测', description: '识别并分析数据中的离群值或异常波动。' },
                                    { title: '4. 结论与建议', description: '基于分析结果给出可落地的业务建议。' }
                                  ]
                                }]);
                              }}
                              disabled={!wizardTheme || wizardSelectedTables.length === 0}
                              className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                              生成分析大纲 <ArrowRight size={18} />
                            </button>
                          </div>
                        </div>
                      ) : msg.type === 'report_wizard_outline' ? (
                        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden animate-in zoom-in-95">
                          <div className="p-8">
                            <div className="flex items-center gap-3 mb-6">
                              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                                <ListTree size={20} />
                              </div>
                              <h3 className="text-xl font-bold text-slate-800">报告大纲确认</h3>
                            </div>
                            <p className="text-slate-700 font-medium mb-6">{msg.content}</p>
                            
                            <div className="space-y-4 mb-8">
                              {msg.outline.map((item: any, i: number) => (
                                <div key={i} className="group p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-4 hover:border-blue-200 transition-all">
                                  <div className="w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-[10px] font-black text-slate-400 shrink-0">
                                    {i + 1}
                                  </div>
                                  <div className="flex-1 space-y-2">
                                    <div className="relative">
                                      <input 
                                        type="text"
                                        value={item.title}
                                        onChange={e => handleUpdateWizardOutline(idx, i, 'title', e.target.value)}
                                        className="w-full font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-blue-500 outline-none transition-colors"
                                        placeholder="章节标题"
                                      />
                                      <textarea 
                                        value={item.description}
                                        onChange={e => handleUpdateWizardOutline(idx, i, 'description', e.target.value)}
                                        className="w-full text-xs text-slate-500 bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-500 outline-none resize-none h-12 mt-1 rounded p-1 transition-colors"
                                        placeholder="章节描述"
                                      />
                                      <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 flex gap-2">
                                        <button 
                                          onClick={() => handleDeleteWizardOutlineItem(idx, i)}
                                          className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-red-600 hover:border-red-200 transition-all shadow-sm"
                                          title="删除章节"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              
                              <button 
                                onClick={() => handleAddWizardOutlineItem(idx)}
                                className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold text-xs hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/30 transition-all flex items-center justify-center gap-2"
                              >
                                <Plus size={14} /> 添加新章节
                              </button>
                            </div>
                            
                            <div className="flex justify-end gap-3">
                              <button 
                                onClick={() => startReportGeneration(msg.outline)}
                                className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
                              >
                                开始生成报告 <Sparkles size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : msg.type === 'report_wizard_progress' ? (
                        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden animate-in zoom-in-95">
                          <div className="p-8">
                            <div className="flex items-center gap-3 mb-8">
                              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                                <RefreshCw size={20} className="animate-spin" />
                              </div>
                              <h3 className="text-xl font-bold text-slate-800">报告生成中</h3>
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-3 mb-8">
                              <div className="flex justify-between text-xs font-black text-slate-400 uppercase tracking-widest">
                                <span>总体进度</span>
                                <span>{msg.progress}%</span>
                              </div>
                              <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden border border-slate-200 p-1">
                                <div 
                                  className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500 ease-out shadow-lg shadow-blue-500/20"
                                  style={{ width: `${msg.progress}%` }}
                                ></div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {msg.tasks.map((task: any, i: number) => (
                                <div key={i} className={cn(
                                  "flex items-center justify-between p-4 rounded-2xl border transition-all duration-300",
                                  task.status === 'success' ? "bg-emerald-50 border-emerald-100" :
                                  task.status === 'running' ? "bg-blue-50 border-blue-200 shadow-md scale-[1.02]" :
                                  "bg-slate-50 border-slate-100 opacity-60"
                                )}>
                                  <div className="flex items-center gap-3">
                                    <div className={cn(
                                      "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                                      task.status === 'success' ? "bg-emerald-500 text-white" :
                                      task.status === 'running' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" :
                                      "bg-slate-200 text-slate-400"
                                    )}>
                                      {task.status === 'success' ? <Check size={16} /> :
                                       task.status === 'running' ? <RefreshCw size={16} className="animate-spin" /> :
                                       <Clock size={16} />}
                                    </div>
                                    <span className={cn(
                                      "font-bold text-sm",
                                      task.status === 'success' ? "text-emerald-700" :
                                      task.status === 'running' ? "text-blue-700" :
                                      "text-slate-500"
                                    )}>{task.label}</span>
                                  </div>
                                  <div className={cn(
                                    "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                                    task.status === 'success' ? "bg-emerald-100 text-emerald-600" :
                                    task.status === 'running' ? "bg-blue-100 text-blue-600 animate-pulse" :
                                    "bg-slate-100 text-slate-400"
                                  )}>
                                    {task.status === 'success' ? '成功' : task.status === 'running' ? '运行中' : '等待'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : msg.type === 'report_wizard_complete' ? (
                        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden animate-in zoom-in-95">
                          {(() => {
                            const report = reports.find(r => r.id === msg.reportId);
                            if (!report) return null;
                            const isCollapsed = msg.isCollapsed;
                            const isEditing = msg.isEditing;
                            
                            return (
                              <div className="p-8 space-y-8">
                                <div className="border-b border-slate-100 pb-6 flex justify-between items-start">
                                  <div>
                                    <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">{report.title}</h1>
                                    <div className="flex items-center gap-4 text-sm font-bold text-slate-500">
                                      <span className="flex items-center gap-1.5"><Calendar size={16} className="text-slate-400" /> {report.date || report.createdAt}</span>
                                      <span className="flex items-center gap-1.5"><User size={16} className="text-slate-400" /> AI 智能生成</span>
                                    </div>
                                  </div>
                                  <button 
                                    onClick={() => {
                                      const newMsgs = [...messages];
                                      newMsgs[idx].isCollapsed = !isCollapsed;
                                      setMessages(newMsgs);
                                    }}
                                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
                                  >
                                    {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                                  </button>
                                </div>
                                
                                {!isCollapsed && (
                                  <>
                                    <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6">
                                      <div className="flex items-center gap-2 text-xs font-black text-blue-600 uppercase tracking-widest mb-3">
                                        <Sparkles size={14} /> 核心摘要
                                      </div>
                                      {isEditing ? (
                                        <textarea 
                                          className="w-full bg-white border border-blue-200 rounded-xl p-4 text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                                          defaultValue={report.summary}
                                          onChange={(e) => {
                                            const newReports = [...reports];
                                            const rIdx = newReports.findIndex(r => r.id === report.id);
                                            if (rIdx !== -1) {
                                              newReports[rIdx].summary = e.target.value;
                                              setReports(newReports);
                                            }
                                          }}
                                        />
                                      ) : (
                                        <p className="text-slate-700 leading-relaxed font-medium">{report.summary}</p>
                                      )}
                                    </div>

                                    <div className="space-y-8">
                                      {report.sections.map((section: any, sIdx: number) => (
                                        <div key={sIdx} className="space-y-4">
                                          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center text-sm">{sIdx + 1}</span>
                                            {isEditing ? (
                                              <input 
                                                className="bg-transparent border-b border-slate-200 focus:border-blue-500 outline-none"
                                                defaultValue={section.title}
                                                onChange={(e) => {
                                                  const newReports = [...reports];
                                                  const rIdx = newReports.findIndex(r => r.id === report.id);
                                                  if (rIdx !== -1) {
                                                    newReports[rIdx].sections[sIdx].title = e.target.value;
                                                    setReports(newReports);
                                                  }
                                                }}
                                              />
                                            ) : section.title}
                                          </h3>
                                          {isEditing ? (
                                            <textarea 
                                              className="w-full bg-white border border-slate-200 rounded-xl p-4 text-slate-600 leading-relaxed focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"
                                              defaultValue={section.content}
                                              onChange={(e) => {
                                                const newReports = [...reports];
                                                const rIdx = newReports.findIndex(r => r.id === report.id);
                                                if (rIdx !== -1) {
                                                  newReports[rIdx].sections[sIdx].content = e.target.value;
                                                  setReports(newReports);
                                                }
                                              }}
                                            />
                                          ) : (
                                            <p className="text-slate-600 leading-relaxed pl-11">{section.content}</p>
                                          )}
                                          
                                          {/* Chart for the first section */}
                                          {sIdx === 0 && (
                                            <div className="pl-11 mt-6">
                                              <div className="h-[300px] bg-slate-50 rounded-2xl border border-slate-100 p-6">
                                                <ResponsiveContainer width="100%" height="100%">
                                                  <BarChart data={CHART_DATA}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis dataKey="accident_type" axisLine={false} tickLine={false} />
                                                    <YAxis axisLine={false} tickLine={false} />
                                                    <Tooltip />
                                                    <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                                                  </BarChart>
                                                </ResponsiveContainer>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </>
                                )}

                                <div className="flex gap-4 pt-6 border-t border-slate-100">
                                  <button 
                                    onClick={() => {
                                      const newMsgs = [...messages];
                                      newMsgs[idx].isEditing = !isEditing;
                                      newMsgs[idx].isCollapsed = false;
                                      setMessages(newMsgs);
                                    }}
                                    className={cn(
                                      "flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 rounded-xl font-bold transition-all active:scale-95",
                                      isEditing ? "bg-blue-50 border-blue-500 text-blue-600" : "bg-white border-slate-200 text-slate-700 hover:border-blue-500 hover:text-blue-600"
                                    )}
                                  >
                                    {isEditing ? <CheckCircle2 size={18} /> : <Edit3 size={18} />}
                                    {isEditing ? "完成编辑" : "直接编辑"}
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setReportToSave(report);
                                      setShowSaveReportDrawer(true);
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                                  >
                                    <Save size={18} /> 保存报告
                                  </button>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      ) : msg.type === 'recall' ? (
                        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden">
                          <div className="p-6 bg-slate-50/50 border-b border-slate-100">
                            <p className="text-slate-700 font-medium mb-6">{msg.content}</p>
                            
                            {/* Tabs Switch */}
                            <div className="flex items-center gap-8 border-b border-slate-200 mb-6">
                              <button 
                                onClick={() => setRecallTab('metrics')}
                                className={cn(
                                  "pb-3 text-sm font-bold transition-all relative",
                                  recallTab === 'metrics' ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
                                )}
                              >
                                指标
                                {recallTab === 'metrics' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
                              </button>
                              <button 
                                onClick={() => setRecallTab('tables')}
                                className={cn(
                                  "pb-3 text-sm font-bold transition-all relative",
                                  recallTab === 'tables' ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
                                )}
                              >
                                数据表
                                {recallTab === 'tables' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {recallTab === 'tables' ? tables.map(table => (
                                <div 
                                  key={table.id}
                                  onClick={() => {
                                    setTables(tables.map(t => t.id === table.id ? {...t, selected: !t.selected} : t));
                                    setMessages(prev => {
                                      const newMsgs = [...prev];
                                      const lastMsg = newMsgs[newMsgs.length - 1];
                                      if (lastMsg.type === 'recall') {
                                        newMsgs[newMsgs.length - 1] = { ...lastMsg, countdown: undefined };
                                      }
                                      return newMsgs;
                                    });
                                  }}
                                  className={cn(
                                    "p-4 rounded-2xl border-2 cursor-pointer transition-all group relative overflow-hidden",
                                    table.selected ? "bg-blue-50 border-blue-500 shadow-md" : "bg-white border-slate-100 hover:border-slate-300"
                                  )}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <h4 className={cn("font-bold transition-colors", table.selected ? "text-blue-700" : "text-slate-800")}>{table.name}</h4>
                                    <div className={cn(
                                      "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                      table.selected ? "bg-blue-600 border-blue-600 text-white" : "border-slate-200 bg-white"
                                    )}>
                                      {table.selected && <Check size={14} />}
                                    </div>
                                  </div>
                                  <code className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 mb-2 block w-fit">{table.code}</code>
                                  <p className="text-xs text-slate-500 leading-relaxed mb-4">{table.description}</p>
                                  
                                  <div className="flex items-center gap-4 mt-auto">
                                    <span className="text-[10px] font-bold text-slate-400 hover:text-blue-600 transition-colors">参与分析</span>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewMetadata({ type: 'table', data: table });
                                        setRightPanelMode('metadata');
                                        setShowRightPanel(true);
                                      }}
                                      className="text-[10px] font-bold text-blue-600 hover:underline"
                                    >
                                      预览
                                    </button>
                                  </div>
                                </div>
                              )) : metrics.map(metric => (
                                <div 
                                  key={metric.id}
                                  onClick={() => {
                                    setMetrics(metrics.map(m => m.id === metric.id ? {...m, selected: !m.selected} : m));
                                    setMessages(prev => {
                                      const newMsgs = [...prev];
                                      const lastMsg = newMsgs[newMsgs.length - 1];
                                      if (lastMsg.type === 'recall') {
                                        newMsgs[newMsgs.length - 1] = { ...lastMsg, countdown: undefined };
                                      }
                                      return newMsgs;
                                    });
                                  }}
                                  className={cn(
                                    "p-4 rounded-2xl border-2 cursor-pointer transition-all group relative overflow-hidden",
                                    metric.selected ? "bg-blue-50 border-blue-500 shadow-md" : "bg-white border-slate-100 hover:border-slate-300"
                                  )}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <h4 className={cn("font-bold transition-colors", metric.selected ? "text-blue-700" : "text-slate-800")}>{metric.name}</h4>
                                    <div className={cn(
                                      "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                      metric.selected ? "bg-blue-600 border-blue-600 text-white" : "border-slate-200 bg-white"
                                    )}>
                                      {metric.selected && <Check size={14} />}
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {metric.tags?.map(tag => (
                                      <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-md">{tag}</span>
                                    ))}
                                  </div>
                                  <p className="text-xs text-slate-500 leading-relaxed mb-4">{metric.description}</p>
                                  
                                  <div className="flex items-center gap-4 mt-auto">
                                    <span className="text-[10px] font-bold text-slate-400 hover:text-blue-600 transition-colors">参与分析</span>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewMetadata({ type: 'metric', data: metric });
                                        setRightPanelMode('metadata');
                                        setShowRightPanel(true);
                                      }}
                                      className="text-[10px] font-bold text-blue-600 hover:underline"
                                    >
                                      预览
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="p-4 bg-white flex justify-between items-center">
                            <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                              已选择 {recallTab === 'tables' ? tables.filter(t => t.selected).length : metrics.filter(m => m.selected).length} 个{recallTab === 'tables' ? '数据集' : '指标'}
                            </div>
                            <button 
                              onClick={handleConfirmTables}
                              className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                            >
                              确认并开始分析 {msg.countdown !== undefined && msg.countdown > 0 ? `(${msg.countdown}s)` : ''}
                            </button>
                          </div>
                        </div>
                      ) : msg.type === 'report_outline' ? (
                        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden animate-in zoom-in-95">
                          <div className="p-6 bg-slate-50/50 border-b border-slate-100">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                                <Sparkles size={16} />
                              </div>
                              <h3 className="font-bold text-slate-800">智能报告大纲生成</h3>
                            </div>
                            <p className="text-slate-700 font-medium mb-6">{msg.content}</p>
                            
                            {isEditingOutline ? (
                              <div className="bg-white border border-indigo-200 rounded-2xl p-6 space-y-4 shadow-inner ring-2 ring-indigo-50">
                                <div className="flex items-center gap-2 mb-4">
                                  <Edit3 size={16} className="text-indigo-600" />
                                  <span className="text-sm font-bold text-indigo-600">正在编辑大纲...</span>
                                </div>
                                <input 
                                  type="text"
                                  value={editingOutline?.title || ''}
                                  onChange={(e) => setEditingOutline(prev => prev ? {...prev, title: e.target.value} : null)}
                                  className="w-full text-lg font-black text-slate-900 mb-4 p-2 border-b border-slate-200 focus:border-indigo-500 outline-none"
                                  placeholder="报告标题"
                                />
                                <div className="space-y-3">
                                  {editingOutline?.items.map((item, i) => (
                                    <div key={item.id} className={cn("flex gap-3", item.level === 2 ? "ml-8" : "")}>
                                      <div className="flex flex-col gap-1 flex-1">
                                        <input 
                                          type="text"
                                          value={item.title}
                                          onChange={(e) => {
                                            const newItems = [...(editingOutline?.items || [])];
                                            newItems[i] = {...newItems[i], title: e.target.value};
                                            setEditingOutline(prev => prev ? {...prev, items: newItems} : null);
                                          }}
                                          className="w-full font-bold text-slate-800 text-sm p-1 border-b border-slate-100 focus:border-indigo-300 outline-none"
                                          placeholder="章节标题"
                                        />
                                        {item.level === 1 && (
                                          <textarea 
                                            value={item.description || ''}
                                            onChange={(e) => {
                                              const newItems = [...(editingOutline?.items || [])];
                                              newItems[i] = {...newItems[i], description: e.target.value};
                                              setEditingOutline(prev => prev ? {...prev, items: newItems} : null);
                                            }}
                                            className="w-full text-xs text-slate-400 leading-relaxed p-1 bg-slate-50 rounded border-none focus:ring-1 focus:ring-indigo-200 outline-none resize-none"
                                            placeholder="章节描述"
                                            rows={2}
                                          />
                                        )}
                                      </div>
                                      <button 
                                        onClick={() => {
                                          const newItems = editingOutline?.items.filter((_, idx) => idx !== i) || [];
                                          setEditingOutline(prev => prev ? {...prev, items: newItems} : null);
                                        }}
                                        className="text-slate-300 hover:text-red-500 self-start mt-1"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  ))}
                                  <button 
                                    onClick={() => {
                                      const newItem = { id: Math.random().toString(), title: '新章节', level: 1 };
                                      setEditingOutline(prev => prev ? {...prev, items: [...prev.items, newItem]} : null);
                                    }}
                                    className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 pt-2"
                                  >
                                    <Plus size={14} /> 添加章节
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-4 shadow-inner">
                                <div className="text-lg font-black text-slate-900 mb-4">{msg.outline.title}</div>
                                {msg.outline.items.map((item: any) => (
                                  <div key={item.id} className={cn(
                                    "flex gap-4",
                                    item.level === 2 ? "ml-8" : ""
                                  )}>
                                    <div className={cn(
                                      "w-1.5 h-1.5 rounded-full mt-2 shrink-0",
                                      item.level === 1 ? "bg-indigo-600" : "bg-slate-300"
                                    )}></div>
                                    <div className="space-y-1">
                                      <div className={cn(
                                        "font-bold",
                                        item.level === 1 ? "text-slate-800 text-sm" : "text-slate-600 text-xs"
                                      )}>{item.title}</div>
                                      {item.description && <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="p-6 bg-white flex justify-between items-center">
                            <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">分析路径：问题定义 → 假设验证 → 结论推导</div>
                            <div className="flex gap-3">
                              {isEditingOutline ? (
                                <>
                                  <button 
                                    onClick={() => {
                                      setIsEditingOutline(false);
                                      setEditingOutline(null);
                                    }}
                                    className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all"
                                  >
                                    取消
                                  </button>
                                  <button 
                                    onClick={() => {
                                      if (editingOutline) {
                                        const newMsgs = [...messages];
                                        newMsgs[idx] = { ...newMsgs[idx], outline: editingOutline };
                                        setMessages(newMsgs);
                                        setReportOutline(editingOutline);
                                        setIsEditingOutline(false);
                                        setEditingOutline(null);
                                      }
                                    }}
                                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                                  >
                                    <Save size={18} /> 保存大纲
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button 
                                    onClick={() => {
                                      setEditingOutline(msg.outline);
                                      setIsEditingOutline(true);
                                    }}
                                    className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2"
                                  >
                                    <Edit3 size={18} /> 调整大纲
                                  </button>
                                  <button 
                                    onClick={handleConfirmTables}
                                    className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                                  >
                                    <ArrowRight size={18} /> 确认并执行分析
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : msg.type === 'recall_failed' ? (
                        <div className="bg-white border border-red-100 rounded-3xl shadow-xl overflow-hidden animate-in zoom-in-95">
                          <div className="p-8 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-6">
                              <AlertCircle size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">未匹配到相关数据集</h3>
                            <p className="text-slate-500 mb-8 max-w-md">{msg.content} 您可以尝试换一种问法，或者点击下方按钮手动浏览并选择数据表。</p>
                            
                            <div className="flex gap-4">
                              <button 
                                onClick={() => setShowSourcePicker(true)}
                                className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center gap-2"
                              >
                                <Search size={18} /> 手动浏览所有表
                              </button>
                              <button 
                                onClick={() => setMessages(prev => prev.slice(0, -1))}
                                className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all"
                              >
                                重新提问
                              </button>
                            </div>
                          </div>
                          <div className="px-8 py-4 bg-red-50/50 border-t border-red-100 text-[10px] font-bold text-red-400 uppercase tracking-widest text-center">
                            兜底展示方案：引导用户手动选择
                          </div>
                        </div>
                      ) : msg.type === 'ai_steps' ? (
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-4">
                          <div className="flex items-center gap-3 text-emerald-600 font-bold">
                            <CheckCircle2 size={20} />
                            <span>SQL 生成成功</span>
                          </div>
                          <div className="flex items-center gap-3 text-blue-600 font-bold">
                            <Database size={20} />
                            <span>正在提取数据...</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-blue-600 h-full w-2/3 animate-pulse"></div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden">
                          {/* AI Response Header with SQL/Data Toggles */}
                          <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                                <Sparkles size={16} />
                              </div>
                              <span className="font-bold text-slate-800">分析结果</span>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => {
                                  setExpandedProcessIndex(expandedProcessIndex === idx ? null : idx);
                                }}
                                className={cn(
                                  "flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs font-bold transition-all",
                                  expandedProcessIndex === idx 
                                    ? "bg-blue-600 border-blue-600 text-white" 
                                    : "bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600"
                                )}
                              >
                                <Activity size={14} /> 分析过程
                                <ChevronDown size={14} className={cn("transition-transform", expandedProcessIndex === idx && "rotate-180")} />
                              </button>
                              <button 
                                onClick={() => {
                                  setRightPanelMode('data');
                                  setShowRightPanel(true);
                                }}
                                className={cn(
                                  "flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs font-bold transition-all",
                                  showRightPanel && rightPanelMode === 'data'
                                    ? "bg-blue-600 border-blue-600 text-white"
                                    : "bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600"
                                )}
                              >
                                <Table2 size={14} /> 查看数据
                              </button>
                            </div>
                          </div>

                          {/* Collapsible Analysis Process */}
                          {expandedProcessIndex === idx && (
                            <div className="px-6 py-6 bg-slate-50 border-b border-slate-100 animate-in slide-in-from-top-2 duration-300">
                              <div className="flex items-center justify-between mb-6">
                                <h4 className="text-sm font-bold text-slate-700">深度分析任务流</h4>
                                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-widest">已完成</span>
                              </div>
                              
                              <div className="space-y-4">
                                {ANALYSIS_PROCESS.map((step, sIdx) => (
                                  <div key={step.id} className="relative pl-8 pb-6 last:pb-0">
                                    {/* Timeline Line */}
                                    {sIdx !== ANALYSIS_PROCESS.length - 1 && (
                                      <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-slate-200"></div>
                                    )}
                                    
                                    {/* Timeline Dot */}
                                    <div className={cn(
                                      "absolute left-0 top-1 w-6 h-6 rounded-full border-4 flex items-center justify-center z-10",
                                      step.status === 'completed' ? "bg-emerald-500 border-emerald-100 text-white" :
                                      step.status === 'processing' ? "bg-blue-500 border-blue-100 text-white animate-pulse" :
                                      "bg-white border-slate-200 text-slate-300"
                                    )}>
                                      {step.status === 'completed' ? <Check size={12} /> : 
                                       step.status === 'processing' ? <div className="w-1.5 h-1.5 bg-white rounded-full"></div> : 
                                       <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>}
                                    </div>
                                    
                                    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
                                      <div className="flex justify-between items-start mb-2">
                                        <h5 className="text-sm font-bold text-slate-800 leading-tight">{step.title}</h5>
                                        {step.duration && <span className="text-[10px] text-slate-400 font-mono">{step.duration}</span>}
                                      </div>
                                      <p className="text-xs text-slate-500 leading-relaxed mb-3">{step.description}</p>
                                      
                                      {step.reasoning && (
                                        <div className="mt-4 space-y-2">
                                          <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest">
                                            <Sparkles size={12} /> 推理过程
                                          </div>
                                          <div className="text-xs text-slate-600 leading-relaxed bg-blue-50/30 p-3 rounded-xl border border-blue-100/50 italic">
                                            {step.reasoning}
                                          </div>
                                        </div>
                                      )}

                                      {step.pythonCode && (
                                        <div className="mt-4">
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                              <Code size={12} /> Python代码
                                            </div>
                                            <button className="text-slate-400 hover:text-slate-600"><Copy size={12} /></button>
                                          </div>
                                          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 overflow-x-auto">
                                            <pre className="text-[10px] font-mono text-blue-400 leading-relaxed">
                                              {step.pythonCode}
                                            </pre>
                                          </div>
                                        </div>
                                      )}

                                      {step.pythonResult && (
                                        <div className="mt-4">
                                          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                            <Table2 size={12} /> 展示Python结果
                                          </div>
                                          <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
                                            <table className="w-full text-[10px] text-left">
                                              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                                                <tr>
                                                  {step.pythonResult.headers.map((h, i) => (
                                                    <th key={i} className="px-3 py-2 font-bold">{h}</th>
                                                  ))}
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-slate-50">
                                                {step.pythonResult.rows.map((row, ri) => (
                                                  <tr key={ri}>
                                                    {row.map((cell, ci) => (
                                                      <td key={ci} className="px-3 py-2 text-slate-600">{cell}</td>
                                                    ))}
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        </div>
                                      )}

                                      {step.sql && (
                                        <div className="mt-4">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">执行 SQL</span>
                                            <button className="text-blue-600 hover:text-blue-700"><Copy size={12} /></button>
                                          </div>
                                          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 overflow-x-auto">
                                            <pre className="text-[10px] font-mono text-slate-600 leading-tight">
                                              {step.sql}
                                            </pre>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Data Blocks Preview */}
                          {msg.dataBlocks && msg.dataBlocks.length > 0 && (
                            <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 space-y-8">
                              {msg.dataBlocks.map((block: any, bIdx: number) => (
                                <div key={bIdx} className="space-y-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                      <Table2 size={16} className="text-blue-600" />
                                      {block.title}
                                    </h4>
                                    <div className="flex gap-2 items-center">
                                      {block.showChart && (
                                        <ChartTypeSelector 
                                          selected={block.chartType || 'bar'} 
                                          onChange={(val) => {
                                            const newMsgs = [...messages];
                                            newMsgs[idx].dataBlocks[bIdx].chartType = val;
                                            setMessages(newMsgs);
                                          }} 
                                        />
                                      )}
                                      <button 
                                        onClick={() => {
                                          const newMsgs = [...messages];
                                          newMsgs[idx].dataBlocks[bIdx].showSql = !block.showSql;
                                          setMessages(newMsgs);
                                        }}
                                        className={cn(
                                          "flex items-center gap-1.5 px-2 py-1 border rounded-lg text-[10px] font-bold transition-all",
                                          block.showSql ? "bg-slate-800 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                                        )}
                                      >
                                        <Code size={12} /> SQL
                                      </button>
                                      <button 
                                        onClick={() => {
                                          const newMsgs = [...messages];
                                          newMsgs[idx].dataBlocks[bIdx].showChart = !block.showChart;
                                          setMessages(newMsgs);
                                        }}
                                        className={cn(
                                          "flex items-center gap-1.5 px-2 py-1 border rounded-lg text-[10px] font-bold transition-all",
                                          block.showChart ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                                        )}
                                      >
                                        <BarChart3 size={12} /> 可视化
                                      </button>
                                    </div>
                                  </div>

                                  {block.showSql && (
                                    <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 animate-in slide-in-from-top-2 duration-200">
                                      <pre className="text-[10px] font-mono text-blue-400 leading-relaxed overflow-x-auto">
                                        {block.sql}
                                      </pre>
                                    </div>
                                  )}

                                  <div className="overflow-x-auto rounded-xl border border-slate-100 bg-slate-50/30">
                                    <table className="w-full text-left text-xs">
                                      <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                          {block.columns.map((col: string, cIdx: number) => (
                                            <th key={cIdx} className="px-4 py-3 font-bold text-slate-500 whitespace-nowrap">{col}</th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {block.rows.map((row: string[], rIdx: number) => (
                                          <tr key={rIdx} className="hover:bg-white transition-colors">
                                            {row.map((cell: string, cellIdx: number) => (
                                              <td key={cellIdx} className="px-4 py-3 text-slate-600 whitespace-nowrap">{cell}</td>
                                            ))}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>

                                  {block.showChart && (
                                    <div className="mt-4 pt-4 border-t border-slate-50 animate-in zoom-in-95 duration-300">
                                      <div className="h-[240px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                          {block.chartType === 'pie' ? (
                                            <RechartsPieChart>
                                              <Pie
                                                data={block.rows.map((r: any) => ({ name: r[0], value: parseFloat(r[1]) }))}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                              >
                                                {block.rows.map((_: any, index: number) => (
                                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                              </Pie>
                                              <Tooltip />
                                              <Legend verticalAlign="bottom" height={36}/>
                                            </RechartsPieChart>
                                          ) : block.chartType === 'line' ? (
                                            <RechartsLineChart data={block.rows.map((r: any) => ({ name: r[0], value: parseFloat(r[1]) }))}>
                                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                              <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} />
                                              <YAxis axisLine={false} tickLine={false} fontSize={10} />
                                              <Tooltip />
                                              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                            </RechartsLineChart>
                                          ) : block.chartType === 'area' ? (
                                            <AreaChart data={block.rows.map((r: any) => ({ name: r[0], value: parseFloat(r[1]) }))}>
                                              <defs>
                                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                </linearGradient>
                                              </defs>
                                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                              <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} />
                                              <YAxis axisLine={false} tickLine={false} fontSize={10} />
                                              <Tooltip />
                                              <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorValue)" />
                                            </AreaChart>
                                          ) : (
                                            <BarChart data={block.rows.map((r: any) => ({ name: r[0], value: parseFloat(r[1]) }))}>
                                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                              <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} />
                                              <YAxis axisLine={false} tickLine={false} fontSize={10} />
                                              <Tooltip />
                                              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                          )}
                                        </ResponsiveContainer>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Analysis Tabs: Deep Insight & YOY */}
                          <div className="px-6 py-4 border-t border-slate-100 bg-white">
                            <div className="flex gap-6 border-b border-slate-100 mb-4">
                              {['insight', 'yoy'].map((tab) => (
                                <button
                                  key={tab}
                                  onClick={() => {
                                    const newMsgs = [...messages];
                                    newMsgs[idx].activeTab = tab;
                                    setMessages(newMsgs);
                                  }}
                                  className={cn(
                                    "pb-2 text-xs font-bold transition-all relative",
                                    (msg.activeTab || 'insight') === tab ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
                                  )}
                                >
                                  {tab === 'insight' ? '深度洞察' : '同环比分析'}
                                  {(msg.activeTab || 'insight') === tab && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                                  )}
                                </button>
                              ))}
                            </div>

                            {(msg.activeTab || 'insight') === 'insight' ? (
                              <div className="space-y-4 animate-in fade-in duration-300">
                                <div className="flex items-start gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                                  <Sparkles size={16} className="text-blue-600 mt-0.5 shrink-0" />
                                  <div className="space-y-2">
                                    <p className="text-xs font-bold text-blue-900">核心波动归因</p>
                                    <p className="text-xs text-blue-800/70 leading-relaxed">
                                      通过对本期数据的多维下钻，我们发现GMV的增长主要由“单车事故”类别的客单价提升驱动（+12.4%），而“撞人事故”类别的频次有所下降。建议关注高客单价类别的服务质量稳定性。
                                    </p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">潜在风险</p>
                                    <p className="text-xs text-slate-600">危化品运输事故在华东地区的响应时间较上月延迟了15%，需排查调度系统。</p>
                                  </div>
                                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">增长机会</p>
                                    <p className="text-xs text-slate-600">夜间时段的事故处理效率提升显著，可考虑将此模式推广至全时段。</p>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4 animate-in fade-in duration-300">
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">同比 (YoY)</p>
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg font-black text-slate-800">+24.5%</span>
                                      <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-600 rounded-full font-bold">↑ 提升</span>
                                    </div>
                                  </div>
                                  <div className="h-10 w-24">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <AreaChart data={[{v:10}, {v:15}, {v:12}, {v:18}, {v:20}]}>
                                        <Area type="monotone" dataKey="v" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                                      </AreaChart>
                                    </ResponsiveContainer>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">环比 (MoM)</p>
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg font-black text-slate-800">-3.2%</span>
                                      <span className="text-[10px] px-1.5 py-0.5 bg-rose-100 text-rose-600 rounded-full font-bold">↓ 下降</span>
                                    </div>
                                  </div>
                                  <div className="h-10 w-24">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <AreaChart data={[{v:20}, {v:18}, {v:19}, {v:16}, {v:15}]}>
                                        <Area type="monotone" dataKey="v" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} />
                                      </AreaChart>
                                    </ResponsiveContainer>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                            <p className="text-slate-700 leading-relaxed font-medium">{msg.content}</p>
                            <button 
                              onClick={() => {
                                const newReport: Report = {
                                  id: Math.random().toString(36).substr(2, 9),
                                  title: '分析报告 - ' + new Date().toLocaleDateString(),
                                  subtitle: '基于智能问数生成的分析报告',
                                  summary: msg.content,
                                  date: new Date().toISOString().split('T')[0],
                                  sections: msg.dataBlocks?.map((b: any, bIdx: number) => ({
                                    id: `s_${bIdx}`,
                                    title: b.title,
                                    content: `根据数据分析显示，${b.title}呈现出明显的特征。具体数据如下：${b.rows.map((r: any) => r.join(': ')).join('; ')}。这表明在当前业务环境下，该维度的数据表现符合预期，但仍有优化空间。`
                                  })) || [
                                    { id: 's1', title: '分析结论', content: msg.content }
                                  ],
                                  chartType: msg.dataBlocks?.[0]?.chartType || 'bar',
                                  chartData: msg.dataBlocks?.[0]?.rows.map((r: any) => ({ accident_type: r[0], count: parseInt(r[1]) || 0 })) || [],
                                  references: [
                                    { id: 1, source: '智能问数系统', description: '基于当前对话上下文及实时数据查询生成' }
                                  ],
                                  tags: ['智能分析'],
                                  createdAt: new Date().toLocaleString(),
                                  type: 'one-time'
                                };
                                setActiveReport(newReport);
                                setRightPanelMode('report');
                                setShowRightPanel(true);
                                setIsEditingReport(true);
                              }}
                              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                            >
                              <Sparkles size={18} />
                              生成报告
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {isGeneratingOutline && (
                  <div className="flex gap-6 animate-pulse mt-8">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                      <Sparkles size={24} />
                    </div>
                    <div className="bg-white border border-slate-200 rounded-3xl px-6 py-4 shadow-xl flex items-center gap-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                      </div>
                      <span className="text-sm font-bold text-indigo-600">正在思考推理并规划分析大纲...</span>
                    </div>
                  </div>
                )}

                {isAnalyzing && (
                  <div className="flex gap-6 animate-pulse mt-8">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
                      <Activity size={24} />
                    </div>
                    <div className="bg-white border border-slate-200 rounded-3xl px-6 py-4 shadow-xl flex items-center gap-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-75"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150"></div>
                      </div>
                      <span className="text-sm font-bold text-blue-600">正在拆解分析任务并执行 Python 代码...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Input Area */}
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-white via-white to-transparent">
              <div className="max-w-4xl mx-auto relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2rem] blur opacity-20 group-focus-within:opacity-40 transition-opacity"></div>
                <div className="relative flex items-center bg-white border-2 border-slate-100 rounded-[2rem] shadow-2xl focus-within:border-blue-500 transition-all overflow-hidden">
                  <div className="pl-6 text-slate-300">
                    <MessageSquare size={24} />
                  </div>
                  <input 
                    type="text" 
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    placeholder="向 数据分析智能助手 提问... (输入 / 或 @ 唤起命令)" 
                    className="flex-1 px-4 py-6 bg-transparent outline-none text-lg font-medium placeholder:text-slate-300"
                  />
                  <div className="pr-4">
                    <button 
                      onClick={() => handleSendMessage()}
                      className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30"
                    >
                      <Sparkles size={24} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right Panel - Contextual Drawer */}
      {showRightPanel && (
        <div className={cn(
          "bg-white border-l border-gray-200 flex flex-col shadow-2xl z-40 transition-all duration-300",
          isFullscreenReport && rightPanelMode === 'report' 
            ? "fixed inset-0 w-full h-full z-[60]" 
            : "w-[500px] animate-in slide-in-from-right-8"
        )}>
          {/* Panel Header */}
          <div className="px-6 py-6 border-b border-gray-100 bg-white sticky top-0 z-20">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                  {rightPanelMode === 'data' ? <Table2 size={18} /> : 
                   rightPanelMode === 'sql' ? <Code size={18} /> :
                   rightPanelMode === 'report_wizard' ? <Sparkles size={18} /> :
                   rightPanelMode === 'report_management' ? <History size={18} /> :
                   rightPanelMode === 'metadata' ? <Search size={18} /> :
                   <FileText size={18} />}
                </div>
                {rightPanelMode === 'data' ? '数据明细' : 
                 rightPanelMode === 'sql' ? 'SQL 查询语句' :
                 rightPanelMode === 'report_wizard' ? '智能报告向导' :
                 rightPanelMode === 'report_management' ? '报告管理' :
                 rightPanelMode === 'metadata' ? '元数据预览' :
                 '分析报告'}
              </h3>
              <div className="flex items-center gap-2">
                {rightPanelMode === 'report' && (
                  <button 
                    onClick={() => setIsFullscreenReport(!isFullscreenReport)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    title={isFullscreenReport ? "退出全屏" : "全屏查看"}
                  >
                    {isFullscreenReport ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                  </button>
                )}
                <button 
                  onClick={() => {
                    setShowRightPanel(false);
                    setIsFullscreenReport(false);
                    setReportWizardStep(1);
                    setWizardSelectedSource(null);
                    setWizardSelectedTables([]);
                  }} 
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto bg-gray-50/30">
            {rightPanelMode === 'data' ? (
              <div className="p-6 space-y-4">
                <div className="text-sm font-bold text-slate-700 px-1">统计事故类型分布情况</div>
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 border-b border-gray-200">
                      <tr>
                        <th className="px-5 py-4 font-bold uppercase tracking-widest text-[10px]">事故类型</th>
                        <th className="px-5 py-4 font-bold uppercase tracking-widest text-[10px] text-right">事故数量</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {CHART_DATA.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4 text-slate-700 font-medium">{row.accident_type}</td>
                          <td className="px-5 py-4 text-slate-900 text-right font-black">{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : rightPanelMode === 'metadata' ? (
              <div className="flex flex-col h-full bg-white animate-in slide-in-from-right-4">
                <div className="p-8 space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                      {previewMetadata?.type === 'table' ? <Table2 size={28} /> : <Activity size={28} />}
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-slate-900">{previewMetadata?.data?.name}</h4>
                      <code className="text-xs font-mono text-slate-400">{previewMetadata?.data?.code}</code>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">描述信息</label>
                    <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      {previewMetadata?.data?.description}
                    </p>
                  </div>

                  {previewMetadata?.type === 'table' ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">字段信息 ({previewMetadata?.data?.columns?.length || 0})</label>
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">MySQL</span>
                      </div>
                      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                            <tr>
                              <th className="px-4 py-3 font-bold">字段名</th>
                              <th className="px-4 py-3 font-bold">类型</th>
                              <th className="px-4 py-3 font-bold">描述</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {previewMetadata?.data?.columns?.map((col: any, i: number) => (
                              <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-4 py-3 font-bold text-slate-700">{col.name}</td>
                                <td className="px-4 py-3 font-mono text-blue-600">{col.type}</td>
                                <td className="px-4 py-3 text-slate-500">{col.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">计算逻辑</label>
                        <div className="bg-slate-900 rounded-2xl p-6 font-mono text-xs text-blue-400 leading-relaxed border border-slate-800 shadow-xl">
                          {previewMetadata?.data?.formula}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">业务标签</label>
                        <div className="flex flex-wrap gap-2">
                          {previewMetadata?.data?.tags?.map((tag: string) => (
                            <span key={tag} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold border border-blue-100">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                    <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 leading-relaxed">
                      预览模式仅展示元数据信息。如需查看实际数据明细，请在分析完成后点击“查看数据”按钮。
                    </p>
                  </div>
                </div>
              </div>
            ) : rightPanelMode === 'report_management' ? (
              <div className="flex flex-col h-full bg-white">
                <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input placeholder="搜索报告..." className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500" />
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all flex items-center gap-2">
                    <Plus size={14} /> 新建报告
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {[
                    { title: '2025年Q1事故分析报告', date: '2025-03-18', status: 'scheduled', freq: '每月' },
                    { title: '华东区域电子品类波动分析', date: '2025-03-15', status: 'completed', freq: '-' },
                    { title: '年度安全生产总结', date: '2024-12-31', status: 'completed', freq: '-' }
                  ].map((r, i) => (
                    <div key={i} className="p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all group cursor-pointer">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{r.title}</h4>
                        <div className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest",
                          r.status === 'scheduled' ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-400"
                        )}>
                          {r.status === 'scheduled' ? '定时更新' : '已完成'}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-medium text-slate-400">
                        <div className="flex items-center gap-1"><Clock size={12} /> {r.date}</div>
                        {r.freq !== '-' && <div className="flex items-center gap-1"><RefreshCw size={12} /> {r.freq}</div>}
                      </div>
                      <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="flex-1 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold hover:bg-blue-100">查看</button>
                        <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg"><Settings2 size={14} /></button>
                        <button className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : rightPanelMode === 'report_wizard' ? (
              <div className="flex flex-col h-full bg-white">
                {/* Wizard Steps */}
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  {[
                    { step: 1, label: '主题及数据' },
                    { step: 2, label: '大纲编撰' },
                    { step: 3, label: '正文生成' }
                  ].map((s, i) => (
                    <React.Fragment key={s.step}>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
                          reportWizardStep === s.step 
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-110" 
                            : reportWizardStep > s.step 
                              ? "bg-emerald-500 text-white" 
                              : "bg-slate-200 text-slate-500"
                        )}>
                          {reportWizardStep > s.step ? <Check size={12} /> : s.step}
                        </div>
                        <span className={cn(
                          "text-xs font-bold transition-colors",
                          reportWizardStep === s.step ? "text-blue-600" : "text-slate-400"
                        )}>{s.label}</span>
                      </div>
                      {i < 2 && <div className="flex-1 h-px bg-slate-200 mx-2"></div>}
                    </React.Fragment>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                  {reportWizardStep === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                      <div className="space-y-4">
                        <label className="block text-sm font-black text-slate-800 uppercase tracking-widest">文章主题 <span className="text-red-500">*</span></label>
                        <textarea 
                          value={wizardTheme}
                          onChange={e => setWizardTheme(e.target.value)}
                          placeholder="例如：2025年第一季度事故分析报告"
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 font-medium min-h-[120px] transition-all"
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="block text-sm font-black text-slate-800 uppercase tracking-widest">数据范围 <span className="text-red-500">*</span></label>
                        
                        {!wizardSelectedSource ? (
                          <div className="space-y-3">
                            <p className="text-xs text-slate-400 font-bold">请先选择数据源</p>
                            <div className="grid grid-cols-1 gap-3">
                              {SYSTEM_SOURCES.map(source => (
                                <div 
                                  key={source.id}
                                  onClick={() => setWizardSelectedSource(source)}
                                  className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50/30 cursor-pointer transition-all flex items-center justify-between group"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                      <Database size={20} />
                                    </div>
                                    <div>
                                      <div className="text-sm font-bold text-slate-800">{source.name}</div>
                                      <div className="text-[10px] font-mono text-slate-400 uppercase">{source.type}</div>
                                    </div>
                                  </div>
                                  <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-600 transition-all" />
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="px-2 py-1 bg-blue-600 text-white rounded text-[10px] font-black uppercase tracking-widest">
                                  {wizardSelectedSource.type}
                                </div>
                                <span className="text-sm font-bold text-slate-700">{wizardSelectedSource.name}</span>
                              </div>
                              <button 
                                onClick={() => {
                                  setWizardSelectedSource(null);
                                  setWizardSelectedTables([]);
                                }}
                                className="text-xs font-bold text-blue-600 hover:underline"
                              >
                                切换数据源
                              </button>
                            </div>

                            <div className="space-y-3">
                              <p className="text-xs text-slate-400 font-bold">选择数据表 ({wizardSelectedTables.length})</p>
                              <div className="flex flex-wrap gap-2">
                                {RECALLED_TABLES.map(table => (
                                  <button
                                    key={table.id}
                                    onClick={() => {
                                      if (wizardSelectedTables.includes(table.code)) {
                                        setWizardSelectedTables(prev => prev.filter(t => t !== table.code));
                                      } else {
                                        setWizardSelectedTables(prev => [...prev, table.code]);
                                      }
                                    }}
                                    className={cn(
                                      "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all border",
                                      wizardSelectedTables.includes(table.code)
                                        ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/20"
                                        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                                    )}
                                  >
                                    <Table2 size={12} /> {table.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {reportWizardStep === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                      <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center">
                          <Sparkles size={16} />
                        </div>
                        <div className="text-sm font-bold text-blue-700">大纲已生成，可以进行修改优化啦~</div>
                      </div>
                      
                      <div className="space-y-4 pl-4 border-l-2 border-blue-100">
                        {[
                          { id: '1', title: '企业基本信息数据分析', sub: ['企业规模与行业分布', '企业地域分布分析', '企业成立时间趋势分析'] },
                          { id: '2', title: '分析结论和建议', sub: ['结论', '建议'] }
                        ].map((chapter, i) => (
                          <div key={chapter.id} className="space-y-3 relative">
                            <div className="absolute -left-[17px] top-2 w-4 h-4 rounded-full bg-blue-600 border-4 border-white"></div>
                            <div className="flex items-center gap-3 group">
                              <span className="text-xs font-black text-slate-400">第{chapter.id}章</span>
                              <input 
                                defaultValue={chapter.title}
                                className="flex-1 bg-transparent border-b border-transparent focus:border-blue-500 outline-none font-bold text-slate-800 py-1"
                              />
                            </div>
                            <div className="space-y-2 pl-8">
                              {chapter.sub.map((sub, j) => (
                                <div key={j} className="flex items-center gap-3 group relative">
                                  <div className="absolute -left-[33px] top-1/2 w-2 h-2 rounded-full bg-blue-200 border-2 border-white"></div>
                                  <span className="text-[10px] font-bold text-slate-300">{chapter.id}.{j+1}</span>
                                  <input 
                                    defaultValue={sub}
                                    className="flex-1 bg-transparent border-b border-transparent focus:border-blue-500 outline-none text-sm text-slate-600 py-1"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {reportWizardStep === 3 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                      <div className="text-center space-y-4 py-12">
                        <div className="relative inline-block">
                          <div className="w-20 h-20 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
                          <div className="absolute inset-0 flex items-center justify-center text-blue-600">
                            <Sparkles size={32} className="animate-pulse" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-lg font-black text-slate-800">正在生成报告正文...</h4>
                          <p className="text-sm text-slate-400">AI 正在深度挖掘数据并撰写分析结论</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                          <span>生成进度</span>
                          <span>{generationProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                          <div 
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full transition-all duration-500 ease-out shadow-lg shadow-blue-500/20"
                            style={{ width: `${generationProgress}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        {generationTasks.map((task, i) => (
                          <div key={i} className={cn(
                            "flex items-center justify-between p-5 rounded-2xl border transition-all duration-300",
                            task.status === 'success' ? "bg-emerald-50 border-emerald-100" :
                            task.status === 'running' ? "bg-blue-50 border-blue-200 shadow-md scale-[1.02]" :
                            "bg-slate-50 border-slate-100 opacity-60"
                          )}>
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                                task.status === 'success' ? "bg-emerald-500 text-white" :
                                task.status === 'running' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" :
                                "bg-slate-200 text-slate-400"
                              )}>
                                {task.status === 'success' ? <Check size={18} /> :
                                 task.status === 'running' ? <RefreshCw size={18} className="animate-spin" /> :
                                 <Clock size={18} />}
                              </div>
                              <span className={cn(
                                "font-bold",
                                task.status === 'success' ? "text-emerald-700" :
                                task.status === 'running' ? "text-blue-700" :
                                "text-slate-500"
                              )}>{task.label}</span>
                            </div>
                            <div className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                              task.status === 'success' ? "bg-emerald-100 text-emerald-600" :
                              task.status === 'running' ? "bg-blue-100 text-blue-600 animate-pulse" :
                              "bg-slate-100 text-slate-400"
                            )}>
                              {task.status === 'success' ? '成功' : task.status === 'running' ? '运行中' : '等待中'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
                  {reportWizardStep > 1 && reportWizardStep < 3 && (
                    <button 
                      onClick={() => setReportWizardStep(prev => (prev - 1) as any)}
                      className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2"
                    >
                      <ArrowLeft size={18} /> 上一步
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      if (reportWizardStep === 1) {
                        setReportWizardStep(2);
                      } else if (reportWizardStep === 2) {
                        startReportGeneration();
                      } else if (reportWizardStep === 3 && generationProgress === 100) {
                        setRightPanelMode('report');
                        setShowRightPanel(true);
                        setReportWizardStep(1);
                        setWizardSelectedSource(null);
                        setWizardSelectedTables([]);
                      }
                    }}
                    disabled={(reportWizardStep === 1 && (!wizardTheme || !wizardSelectedSource || wizardSelectedTables.length === 0)) || (reportWizardStep === 3 && generationProgress < 100)}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {reportWizardStep === 3 ? (generationProgress === 100 ? '查看报告' : '生成中...') : '下一步'}
                    {reportWizardStep < 3 && <ArrowRight size={18} />}
                  </button>
                </div>
              </div>
            ) : rightPanelMode === 'sql' ? (
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center px-1">
                  <div className="text-sm font-bold text-slate-700">自动生成的 SQL</div>
                  <button className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                    <Copy size={12} /> 复制 SQL
                  </button>
                </div>
                <div className="bg-slate-900 rounded-2xl p-6 shadow-xl overflow-x-auto">
                  <pre className="text-blue-400 font-mono text-xs leading-relaxed">
                    {demoSql}
                  </pre>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                  <AlertCircle size={18} className="text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700 leading-relaxed">
                    该 SQL 是根据您的自然语言描述自动生成的。系统已自动关联了 <strong>ods_accident_record</strong> 表，并按事故类型进行了聚合统计。
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full bg-white">
                {/* Report Content */}
                <div className={cn(
                  "flex-1 overflow-y-auto p-6 space-y-8",
                  isFullscreenReport && "max-w-5xl mx-auto w-full"
                )}>
                  <div className="flex justify-between items-center mb-4">
                    {activeReport?.type === 'history' ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg text-xs font-bold">
                        <History size={14} /> 当前查看的是历史版本 ({activeReport.createdAt})
                      </div>
                    ) : (
                      <button 
                        onClick={() => setIsEditingReport(!isEditingReport)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                          isEditingReport ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100"
                        )}
                      >
                        {isEditingReport ? <><Save size={14} /> 保存修改</> : <><Edit3 size={14} /> 编辑报告</>}
                      </button>
                    )}
                    
                    <div className="flex gap-2">
                      {activeReport?.type === 'history' ? (
                        <>
                          <button className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-bold transition-colors">
                            <Download size={14} /> 导出
                          </button>
                          <button 
                            onClick={() => {
                              const mainReport = reports.find(r => r.history?.some(h => h.reportData.id === activeReport.id));
                              if (mainReport) openReport(mainReport);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-bold transition-colors"
                          >
                            <ArrowLeft size={14} /> 返回主报告
                          </button>
                        </>
                      ) : (
                        <>
                          {activeReport?.type === 'template' && (
                            <button 
                              onClick={() => {
                                setShowHistoryModal(activeReport.id);
                                setRightPanelMode('report_management');
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-bold transition-colors"
                            >
                              <History size={14} /> 历史版本
                            </button>
                          )}
                          <button className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-bold transition-colors">
                            <Share2 size={14} /> 分享
                          </button>
                          <button className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-bold transition-colors">
                            <Download size={14} /> 导出
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {activeReport?.type !== 'history' && (
                    <div className="flex gap-2 mb-4">
                      <button 
                        onClick={() => setShowDataPointModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                      >
                        <Plus size={12} /> 插入数据点
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
                        <BarChart3 size={12} /> 插入图表
                      </button>
                    </div>
                  )}

                  {activeReport && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                      {/* Title Section */}
                      <div className="text-center space-y-2">
                        {isEditingReport ? (
                          <input 
                            value={activeReport.title}
                            onChange={(e) => setActiveReport({...activeReport, title: e.target.value})}
                            className="text-2xl font-black text-center w-full border-b-2 border-blue-100 focus:border-blue-500 outline-none pb-1"
                          />
                        ) : (
                          <h2 className="text-2xl font-black text-slate-900 leading-tight">{activeReport.title}</h2>
                        )}
                        <p className="text-xs text-slate-400 font-medium">生成日期: {activeReport.date}</p>
                      </div>

                      {/* Summary Section */}
                      <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100/50">
                        <div className="flex items-center gap-2 mb-3 text-blue-600">
                          <Sparkles size={16} />
                          <h4 className="text-sm font-bold">核心摘要</h4>
                        </div>
                        {isEditingReport ? (
                          <textarea 
                            value={activeReport.summary}
                            onChange={(e) => setActiveReport({...activeReport, summary: e.target.value})}
                            className="w-full p-3 bg-white rounded-xl border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-700 leading-relaxed min-h-[100px]"
                          />
                        ) : (
                          <p className="text-sm text-slate-700 leading-relaxed">{activeReport.summary}</p>
                        )}
                      </div>

                      {/* Chart Section */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                            <h4 className="text-sm font-bold text-slate-800">可视化分析</h4>
                          </div>
                          {isEditingReport && (
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => setIsEditingData(!isEditingData)}
                                className={cn(
                                  "flex items-center gap-1.5 px-2 py-1 border rounded-md text-[10px] font-bold transition-all",
                                  isEditingData ? "bg-blue-600 border-blue-600 text-white" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                                )}
                              >
                                <Database size={12} /> {isEditingData ? '完成数据编辑' : '编辑数据'}
                              </button>
                              <ChartTypeSelector selected={activeReport.chartType} onChange={(val) => setActiveReport({...activeReport, chartType: val})} />
                            </div>
                          )}
                        </div>
                        
                        {isEditingData && isEditingReport ? (
                          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3 animate-in fade-in slide-in-from-top-2">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">编辑图表数据</div>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                              {(activeReport.chartData || CHART_DATA).map((item: any, idx: number) => (
                                <div key={idx} className="flex gap-2 items-center">
                                  <input 
                                    value={item.accident_type}
                                    onChange={(e) => {
                                      const newData = [...(activeReport.chartData || CHART_DATA)];
                                      newData[idx] = { ...newData[idx], accident_type: e.target.value };
                                      setActiveReport({...activeReport, chartData: newData});
                                    }}
                                    className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"
                                    placeholder="类别"
                                  />
                                  <input 
                                    type="number"
                                    value={item.count}
                                    onChange={(e) => {
                                      const newData = [...(activeReport.chartData || CHART_DATA)];
                                      newData[idx] = { ...newData[idx], count: parseInt(e.target.value) || 0 };
                                      setActiveReport({...activeReport, chartData: newData});
                                    }}
                                    className="w-20 p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"
                                    placeholder="数值"
                                  />
                                  <button 
                                    onClick={() => {
                                      const newData = (activeReport.chartData || CHART_DATA).filter((_, i) => i !== idx);
                                      setActiveReport({...activeReport, chartData: newData});
                                    }}
                                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>
                            <button 
                              onClick={() => {
                                const newData = [...(activeReport.chartData || CHART_DATA), { accident_type: '新类别', count: 0 }];
                                setActiveReport({...activeReport, chartData: newData});
                              }}
                              className="w-full py-2 bg-white border border-dashed border-slate-300 text-slate-400 rounded-lg text-[10px] font-bold hover:border-blue-400 hover:text-blue-500 transition-all flex items-center justify-center gap-1"
                            >
                              <Plus size={12} /> 添加数据项
                            </button>
                          </div>
                        ) : (
                          <div className="h-[280px] bg-white border border-slate-100 rounded-2xl shadow-inner p-4">
                            {activeReport.chartType === 'pie' ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <RechartsPieChart>
                                  <Pie 
                                    data={activeReport.chartData || CHART_DATA} 
                                    cx="50%" 
                                    cy="50%" 
                                    outerRadius={80} 
                                    dataKey="count" 
                                    nameKey="accident_type"
                                  >
                                    {(activeReport.chartData || CHART_DATA).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                  </Pie>
                                  <Tooltip />
                                </RechartsPieChart>
                              </ResponsiveContainer>
                            ) : (
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={activeReport.chartData || CHART_DATA}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                  <XAxis dataKey="accident_type" hide />
                                  <YAxis hide />
                                  <Tooltip />
                                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Detailed Sections */}
                      <div className="space-y-6">
                        {activeReport.sections.map((section, sIdx) => (
                          <div key={section.id || sIdx} className="space-y-3 group relative">
                            <div className="flex justify-between items-center">
                              {isEditingReport ? (
                                <input 
                                  value={section.title}
                                  onChange={(e) => {
                                    const newSections = [...activeReport.sections];
                                    newSections[sIdx].title = e.target.value;
                                    setActiveReport({...activeReport, sections: newSections});
                                  }}
                                  className="text-sm font-bold text-slate-800 w-full border-b border-slate-100 focus:border-blue-500 outline-none"
                                />
                              ) : (
                                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                  <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                                  {section.title}
                                </h4>
                              )}
                              {isEditingReport && (
                                <button 
                                  onClick={() => {
                                    const newSections = activeReport.sections.filter((_, i) => i !== sIdx);
                                    setActiveReport({...activeReport, sections: newSections});
                                  }}
                                  className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                            
                            {isEditingReport ? (
                              <textarea 
                                value={section.content}
                                onChange={(e) => {
                                  const newSections = [...activeReport.sections];
                                  newSections[sIdx].content = e.target.value;
                                  setActiveReport({...activeReport, sections: newSections});
                                }}
                                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-600 leading-relaxed min-h-[100px]"
                              />
                            ) : (
                              <p className="text-sm text-slate-600 leading-relaxed pl-3 border-l-2 border-slate-50">
                                {section.content.split(/(\[\d+\])/).map((part, pIdx) => {
                                  const match = part.match(/\[(\d+)\]/);
                                  if (match) {
                                    const refId = parseInt(match[1]);
                                    return (
                                      <span 
                                        key={pIdx} 
                                        className="inline-flex items-center justify-center w-4 h-4 bg-blue-50 text-blue-600 text-[8px] font-black rounded-full cursor-help hover:bg-blue-600 hover:text-white transition-colors mx-0.5"
                                        title={activeReport.references.find(r => r.id === refId)?.description || '查看来源'}
                                      >
                                        {refId}
                                      </span>
                                    );
                                  }
                                  return part;
                                })}
                              </p>
                            )}
                          </div>
                        ))}

                        {isEditingReport && (
                          <div className="flex justify-center pt-4">
                            <button 
                              onClick={() => {
                                const newSection: ReportSection = {
                                  id: Math.random().toString(36).substr(2, 9),
                                  title: '新章节',
                                  content: '请输入章节内容...'
                                };
                                setActiveReport({...activeReport, sections: [...activeReport.sections, newSection]});
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all border border-blue-100 border-dashed"
                            >
                              <Plus size={14} /> 添加章节
                            </button>
                          </div>
                        )}
                      </div>

                      {/* References Section */}
                      <div className="pt-6 border-t border-slate-100">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">数据来源与引用</h4>
                        <div className="space-y-2">
                          {activeReport.references.map(ref => (
                            <div key={ref.id} className="flex gap-3 text-[11px]">
                              <span className="text-blue-600 font-bold">[{ref.id}]</span>
                              <div className="flex-1">
                                <span className="text-slate-800 font-bold">{ref.source}</span>
                                <span className="text-slate-400 ml-2">— {ref.description}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Action Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
                  <div className={cn("flex gap-3 w-full", isFullscreenReport && "max-w-5xl mx-auto")}>
                    <button 
                      onClick={() => {
                        if (activeReport) {
                          setReportToSave(activeReport);
                          setShowSaveReportDrawer(true);
                        }
                      }}
                      className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Save size={18} /> 保存报告
                    </button>
                    <button className="px-5 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all">
                      <Download size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save as Report Drawer */}
      {showSaveReportDrawer && reportToSave && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-end z-[110] animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileText size={20} className="text-blue-600" /> 保存为报告
              </h3>
              <button 
                onClick={() => setShowSaveReportDrawer(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="space-y-4">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">报告标题</label>
                <input 
                  type="text" 
                  value={reportToSave.title}
                  onChange={(e) => setReportToSave({...reportToSave, title: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                  placeholder="请输入报告标题"
                />
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">报告副标题</label>
                <input 
                  type="text" 
                  value={reportToSave.subtitle}
                  onChange={(e) => setReportToSave({...reportToSave, subtitle: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                  placeholder="请输入报告副标题"
                />
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">更新配置</label>
                <ScheduleConfigSelector 
                  config={scheduleConfig}
                  onChange={setScheduleConfig}
                />
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">报告摘要</label>
                <textarea 
                  value={reportToSave.summary}
                  onChange={(e) => setReportToSave({...reportToSave, summary: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all min-h-[120px] resize-none"
                  placeholder="请输入报告摘要"
                />
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  保存后，您可以在“报告管理”中查看和编辑该报告。如果设置了更新周期，系统将自动按时更新数据。
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-4">
              <button 
                onClick={() => setShowSaveReportDrawer(false)}
                className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all"
              >
                取消
              </button>
              <button 
                onClick={() => {
                  const finalReport: Report = {
                    ...reportToSave,
                    id: reportToSave.id || Math.random().toString(36).substr(2, 9),
                    date: new Date().toISOString().split('T')[0],
                    tags: reportToSave.tags || ['智能分析'],
                    references: reportToSave.references || [],
                    createdAt: reportToSave.createdAt || new Date().toLocaleString(),
                    type: scheduleConfig.enabled ? 'template' : 'one-time',
                    updateCycle: scheduleConfig.frequency,
                    scheduleConfig: scheduleConfig
                  };
                  handleSaveReport(finalReport);
                  setShowSaveReportDrawer(false);
                }}
                className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all"
              >
                确认保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scheduled Update Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Calendar size={20} className="text-blue-600" /> 定时更新
              </h3>
              <button onClick={() => setShowScheduleModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full">
                <X size={24} />
              </button>
            </div>
            <div className="p-8">
              <ScheduleConfigSelector 
                config={activeReport?.scheduleConfig || scheduleConfig}
                onChange={(newConfig) => {
                  if (activeReport) {
                    const updatedReport = { ...activeReport, scheduleConfig: newConfig, type: newConfig.enabled ? 'template' : 'one-time' };
                    setActiveReport(updatedReport);
                    setReports(prev => prev.map(r => r.id === updatedReport.id ? updatedReport : r));
                  } else {
                    setScheduleConfig(newConfig);
                  }
                }}
              />
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
              <button onClick={() => setShowScheduleModal(false)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all">取消</button>
              <button onClick={() => setShowScheduleModal(false)} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all">确定</button>
            </div>
          </div>
        </div>
      )}

      {/* Insert Data Point Modal */}
      {showDataPointModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Database size={20} className="text-blue-600" /> 插入数据点
              </h3>
              <button onClick={() => setShowDataPointModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full">
                <X size={24} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
                <AlertCircle size={18} className="text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 leading-relaxed">
                  请输入查询1个数字/时间/文本结果的SQL，否则只取查询结果中的第一个数值/时间/文本展示。建议先点击SQL的“格式化”再点击“运行”。
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">数据点名称</label>
                  <input placeholder="数据点1" className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-blue-500" />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700">使用AI生成SQL</span>
                      <button className="w-10 h-5 bg-blue-600 rounded-full relative"><div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full"></div></button>
                    </div>
                    <button className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline"><RefreshCw size={12} /> 重新生成</button>
                  </div>
                  <div className="relative">
                    <input 
                      placeholder="例如：龙岗区5月份工单量最大的一天的工单数" 
                      className="w-full pl-4 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all">
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-4 mb-2">
                    <button className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors"><Play size={10} /> 运行</button>
                    <button className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors"><ListTree size={10} /> 格式化</button>
                    <button className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors"><Code size={10} /> SQL解释</button>
                  </div>
                  <div className="bg-slate-900 rounded-2xl p-6 font-mono text-xs text-blue-400 leading-relaxed min-h-[150px]">
                    SELECT COUNT(*) AS `工单数`<br/>
                    FROM 工单明细表<br/>
                    WHERE 事件发生时间 &gt;= '2023-05-01 00:00:00'<br/>
                    AND 事件发生时间 &lt; '2023-06-01 00:00:00'
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
              <button onClick={() => setShowDataPointModal(false)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all">取消</button>
              <button onClick={() => setShowDataPointModal(false)} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all">确定</button>
            </div>
          </div>
        </div>
      )}
      {showSourcePicker && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">
                {isDefaultSourceMode ? '绑定默认数据源' : '选择数据源'}
              </h3>
              <button onClick={() => {
                setShowSourcePicker(false);
                setIsDefaultSourceMode(false);
              }} className="p-2 text-slate-400 hover:text-slate-600 rounded-full">
                <X size={24} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {SYSTEM_SOURCES.map(source => (
                  <div 
                    key={source.id} 
                    onClick={() => {
                      if (selectedSources.find(s => s.id === source.id)) {
                        setSelectedSources(prev => prev.filter(s => s.id !== source.id));
                      } else {
                        setSelectedSources(prev => [...prev, source]);
                      }
                    }}
                    className={cn(
                      "p-6 border-2 rounded-2xl cursor-pointer transition-all relative group",
                      selectedSources.find(s => s.id === source.id) ? "border-blue-500 bg-blue-50" : "border-slate-100 hover:border-slate-200 bg-white"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center mb-4",
                      selectedSources.find(s => s.id === source.id) ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
                    )}>
                      <Server size={20} />
                    </div>
                    <h4 className={cn("font-bold mb-1", selectedSources.find(s => s.id === source.id) ? "text-blue-700" : "text-slate-700")}>
                      {source.name}
                    </h4>
                    <p className={cn("text-xs", selectedSources.find(s => s.id === source.id) ? "text-blue-600 opacity-70" : "text-slate-400")}>
                      {source.type.toUpperCase()} | 4 Tables
                    </p>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (defaultSources.find(s => s.id === source.id)) {
                          setDefaultSources(prev => prev.filter(s => s.id !== source.id));
                        } else {
                          setDefaultSources(prev => [...prev, source]);
                        }
                      }}
                      className={cn(
                        "absolute top-4 right-4 p-1.5 rounded-lg transition-all",
                        defaultSources.find(s => s.id === source.id) ? "bg-emerald-500 text-white" : "bg-slate-50 text-slate-300 hover:text-slate-500"
                      )}
                      title="设为默认数据源"
                    >
                      <Check size={14} />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="space-y-3">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">可用表 (4)</p>
                <div className="grid grid-cols-2 gap-3">
                  {RECALLED_TABLES.map(table => (
                    <div key={table.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span className="text-sm font-bold text-slate-700">{table.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => {
                setShowSourcePicker(false);
                setIsDefaultSourceMode(false);
              }} className="px-6 py-2.5 text-sm font-bold text-slate-500">取消</button>
              <button onClick={() => {
                setShowSourcePicker(false);
                setIsDefaultSourceMode(false);
              }} className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20">确认选择</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
