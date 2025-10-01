import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui';
import { ALGORITHMS } from '../../algorithms';

export default function AlgorithmComparison({ comparison, currentAlgorithm }) {
  if (!comparison) return null;

  const algorithmNames = {
    'bidimensional': 'Combinazione Lunghezze',
    'waste-min': 'Minimizzazione Sfrido',
    'priority': 'Priorità Ordini',
    'roll-min': 'Minimizzazione Bobine',
    'multi': 'Multi-obiettivo',
    'column-gen': 'Generazione Colonne'
  };

  const currentResult = comparison.algorithmResults[currentAlgorithm];
  if (!currentResult) return null;

  // Calculate percentages for current algorithm
  const currentEfficiencyPercent = (parseFloat(currentResult.efficiency) / comparison.bestEfficiency * 100).toFixed(0);
  const currentWastePercent = (comparison.bestWaste / currentResult.waste * 100).toFixed(0);
  const currentRollsPercent = (comparison.bestRollsUsed / currentResult.rollsUsed * 100).toFixed(0);
  const currentPriorityPercent = (currentResult.fulfilledRequests / comparison.bestFulfilled * 100).toFixed(0);

  const metrics = [
    {
      label: 'Efficienza',
      current: currentEfficiencyPercent,
      best: comparison.bestEfficiency,
      bestName: algorithmNames[comparison.bestEfficiencyAlgorithm],
      color: 'bg-blue-500'
    },
    {
      label: 'Sfrido',
      current: currentWastePercent,
      best: comparison.bestWaste,
      bestName: algorithmNames[comparison.bestWasteAlgorithm],
      color: 'bg-red-500'
    },
    {
      label: 'Utilizzo Bobine',
      current: currentRollsPercent,
      best: comparison.bestRollsUsed,
      bestName: algorithmNames[comparison.bestRollsAlgorithm],
      color: 'bg-green-500'
    },
    {
      label: 'Soddisfazione Priorità',
      current: currentPriorityPercent,
      best: comparison.bestFulfilled,
      bestName: algorithmNames[comparison.bestPriorityAlgorithm],
      color: 'bg-purple-500'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confronto Algoritmi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {metrics.map((metric, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span>{metric.label}</span>
              <span>{metric.current}%</span>
            </div>
            
            <div className="relative h-5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${metric.color} transition-all duration-300`}
                style={{ width: `${metric.current}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                {metric.current}%
              </div>
            </div>
            
            <div className="flex justify-between text-xs text-gray-600">
              <span>Migliore: {metric.bestName}</span>
              <span>
                {metric.label === 'Sfrido' ? `${metric.best.toFixed(2)}m²` : 
                 metric.label === 'Utilizzo Bobine' ? `${metric.best}/5` :
                 metric.label === 'Soddisfazione Priorità' ? `${metric.best}/5` :
                 `${metric.best}%`}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

