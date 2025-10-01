import React from 'react';
import { stringToColor } from '../../utils/calculations';

export default function CuttingPattern({ pattern }) {
  const { roll, cuts, waste, efficiency } = pattern;

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900">
          Bobina: {roll.code} ({roll.material})
        </h4>
        <div className="text-sm text-gray-600">
          Efficienza: {efficiency.toFixed(2)}% | Sfrido: {waste}mm
        </div>
      </div>
      
      {/* Visual Pattern */}
      <div className="flex h-12 border border-gray-300 rounded mb-3 overflow-hidden">
        {cuts.map((cut, index) => {
          const cutWidth = (cut.width / roll.width) * 100;
          const color = stringToColor(cut.request.orderNumber);
          
          return (
            <div
              key={index}
              className="flex items-center justify-center text-xs font-medium text-white border-r border-white/20"
              style={{
                width: `${cutWidth}%`,
                backgroundColor: color,
                minWidth: '60px'
              }}
            >
              <div className="text-center">
                <div className="font-bold">{cut.width}mm</div>
                <div className="text-xs opacity-90">{cut.request.orderNumber}</div>
              </div>
            </div>
          );
        })}
        
        {waste > 0 && (
          <div
            className="flex items-center justify-center text-xs font-medium text-red-800 bg-red-200"
            style={{ width: `${(waste / roll.width) * 100}%` }}
          >
            <div className="text-center">
              <div className="font-bold">{waste}mm</div>
              <div className="text-xs">Sfrido</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Cuts Details */}
      <div className="text-xs text-gray-600">
        <div className="grid grid-cols-2 gap-2">
          {cuts.map((cut, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: stringToColor(cut.request.orderNumber) }}
              />
              <span>
                {cut.request.orderNumber}: {cut.width}mm × {cut.length}m
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

