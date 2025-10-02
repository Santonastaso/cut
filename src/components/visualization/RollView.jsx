import React from 'react';
import CuttingPattern from './CuttingPattern';
import { Card, CardContent, CardHeader, CardTitle } from '../ui';

export default function RollView({ result }) {
  if (!result || !result.cuttingPlans) return null;

  // Calculate material statistics
  const getMaterialStats = (materialPlan) => {
    const totalRolls = materialPlan.patterns.length;
    const totalEfficiency = materialPlan.patterns.reduce((sum, pattern) => sum + pattern.efficiency, 0) / totalRolls;
    const totalWaste = materialPlan.patterns.reduce((sum, pattern) => sum + pattern.waste, 0);
    const totalCuts = materialPlan.patterns.reduce((sum, pattern) => sum + pattern.cuts.length, 0);
    
    return { totalRolls, totalEfficiency, totalWaste, totalCuts };
  };

  return (
    <div className="space-y-8">
      {result.cuttingPlans.map((materialPlan, materialIndex) => {
        const stats = getMaterialStats(materialPlan);
        
        return (
          <div key={materialIndex} className="space-y-6">
            {/* Material Header with Statistics */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {materialPlan.material?.charAt(0) || 'M'}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-xl text-gray-900">
                        Materiale: {materialPlan.material}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {stats.totalRolls} bobine utilizzate • {stats.totalCuts} tagli totali
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <div className="text-lg font-bold text-green-600">
                        {stats.totalEfficiency.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-600">Efficienza Media</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <div className="text-lg font-bold text-red-600">
                        {stats.totalWaste}mm
                      </div>
                      <div className="text-xs text-gray-600">Sfrido Totale</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <div className="text-lg font-bold text-blue-600">
                        {stats.totalRolls}
                      </div>
                      <div className="text-xs text-gray-600">Bobine</div>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
            
            {/* Individual Roll Patterns */}
            <div className="space-y-6">
              {materialPlan.patterns.map((pattern, patternIndex) => (
                <div key={patternIndex} className="relative">
                  {/* Roll number indicator */}
                  <div className="absolute -left-4 top-6 z-10">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                      {patternIndex + 1}
                    </div>
                  </div>
                  
                  <CuttingPattern pattern={pattern} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

