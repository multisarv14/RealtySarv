
import React from 'react';
import { Lead, Project, LeadStatus } from '../../../types';
import StatCard from './StatCard';
import ChartCard from './ChartCard';

interface LeadAnalyticsProps {
  leads: Lead[];
  projects: Project[];
}

const STATUS_COLORS: Record<LeadStatus, string> = {
    New: '#3b82f6', // blue-500
    Contacted: '#f59e0b', // amber-500
    Qualified: '#a855f7', // purple-500
    Converted: '#22c55e', // green-500
    Unqualified: '#ef4444', // red-500
};

const LeadAnalytics: React.FC<LeadAnalyticsProps> = ({ leads, projects }) => {
    const safeLeads = leads || [];
    const safeProjects = projects || [];
    
    const analyticsData = React.useMemo(() => {
        const totalLeads = safeLeads.length;
        if (totalLeads === 0) {
            return {
                totalLeads: 0,
                convertedLeads: 0,
                conversionRate: 0,
                leadsBySource: {},
                leadsByStatus: {} as Record<LeadStatus, number>,
            };
        }

        const convertedLeads = safeLeads.filter(l => l.leadStatus === 'Converted').length;
        const conversionRate = (convertedLeads / totalLeads) * 100;
        
        const leadsBySource = safeLeads.reduce((acc, lead) => {
            const source = lead.leadSource || 'Unknown';
            acc[source] = (acc[source] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const leadsByStatus = safeLeads.reduce((acc, lead) => {
            const status = lead.leadStatus;
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as Record<LeadStatus, number>);

        return {
            totalLeads,
            convertedLeads,
            conversionRate,
            leadsBySource,
            leadsByStatus,
        };

    }, [safeLeads]);
    
    const maxSourceCount = Object.values(analyticsData.leadsBySource).length > 0 ? Math.max(...Object.values(analyticsData.leadsBySource) as number[]) : 1;

    const statusGradient = React.useMemo(() => {
        if(analyticsData.totalLeads === 0) return '';
        const statuses: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Converted', 'Unqualified'];
        let gradientParts: string[] = [];
        let currentPercentage = 0;

        statuses.forEach(status => {
            const count = analyticsData.leadsByStatus[status] || 0;
            if (count > 0) {
                const percentage = (count / analyticsData.totalLeads) * 100;
                gradientParts.push(`${STATUS_COLORS[status]} ${currentPercentage}% ${currentPercentage + percentage}%`);
                currentPercentage += percentage;
            }
        });
        return `conic-gradient(${gradientParts.join(', ')})`;
    }, [analyticsData.leadsByStatus, analyticsData.totalLeads]);
    
    if (safeLeads.length === 0) {
        return (
            <div className="p-4 text-[var(--text-secondary)] text-center flex flex-col items-center justify-center h-full">
                <i className="fas fa-chart-line text-5xl mb-4"></i>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">No Data Available</h3>
                <p className="mt-2">Once you start adding leads, your analytics will appear here.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon="fas fa-users" label="Total Leads" value={analyticsData.totalLeads.toLocaleString()} />
                <StatCard icon="fas fa-check-circle" label="Converted Leads" value={analyticsData.convertedLeads.toLocaleString()} />
                <StatCard icon="fas fa-chart-line" label="Conversion Rate" value={`${analyticsData.conversionRate.toFixed(1)}%`} />
                <StatCard icon="fas fa-building" label="Total Projects" value={safeProjects.length.toLocaleString()} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Leads by Source">
                    <div className="flex justify-around items-end h-64 border-l border-b border-[var(--light-bg)] pl-2 pb-2">
                        {Object.entries(analyticsData.leadsBySource).map(([source, count]) => (
                            <div key={source} className="flex flex-col items-center justify-end h-full flex-1 min-w-0" title={`${source}: ${count} leads`}>
                                <p className="text-xs text-[var(--text-secondary)]">{count as number}</p>
                                <div 
                                    className="w-3/4 max-w-[40px] bg-[var(--primary-color)] rounded-t-md hover:opacity-80 transition-opacity" 
                                    style={{ height: `${((count as number) / maxSourceCount) * 90}%` }}
                                ></div>
                                <p className="text-xs mt-2 text-[var(--text-secondary)] text-center break-words w-full truncate">{source}</p>
                            </div>
                        ))}
                    </div>
                </ChartCard>

                <ChartCard title="Lead Status Distribution">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                        <div 
                            className="w-48 h-48 rounded-full relative" 
                            style={{ background: statusGradient }}
                        >
                           <div className="absolute inset-4 bg-[var(--dark-bg)] rounded-full flex items-center justify-center flex-col">
                                <span className="text-3xl font-bold text-[var(--text-primary)]">{analyticsData.totalLeads}</span>
                                <span className="text-sm text-[var(--text-secondary)]">Total Leads</span>
                           </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            {Object.entries(analyticsData.leadsByStatus).map(([status, count]) => (
                                <div key={status} className="flex items-center gap-2 text-sm">
                                    <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: STATUS_COLORS[status as LeadStatus] }}></span>
                                    <span className="text-[var(--text-primary)] w-24">{status}:</span>
                                    <span className="text-[var(--text-secondary)] font-semibold">{count as number}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </ChartCard>
            </div>
        </div>
    );
};

export default LeadAnalytics;
