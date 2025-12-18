import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';

const StatsCard = ({ title, value, change, trend, icon: Icon, color }) => {
    const isPositive = change >= 0;

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="bg-surface rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow"
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${color} bg-opacity-10 dark:bg-opacity-20`}>
                    <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    <span>{Math.abs(change)}%</span>
                </div>
            </div>

            <div>
                <p className="text-text-muted text-sm font-medium mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-text-main">{value}</h3>
                <p className="text-xs text-slate-400 mt-1">{trend}</p>
            </div>
        </motion.div>
    );
};

export default StatsCard;
