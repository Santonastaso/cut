import React from 'react';
import CuttingPattern from './CuttingPattern';
import { Card, CardContent, CardHeader, CardTitle } from '../ui';

export default function RollView({ result }) {
  if (!result || !result.cuttingPlans) return null;

  return (
    <div className="space-y-6">
      {result.cuttingPlans.map((materialPlan, materialIndex) => (
        <div key={materialIndex}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Materiale: {materialPlan.material}
          </h3>
          
          <div className="space-y-4">
            {materialPlan.patterns.map((pattern, patternIndex) => (
              <CuttingPattern key={patternIndex} pattern={pattern} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

