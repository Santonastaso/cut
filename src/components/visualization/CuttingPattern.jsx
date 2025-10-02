import React from 'react';
import { stringToColor } from '../../utils/calculations';

export default function CuttingPattern({ pattern }) {
  const { roll, cuts, waste, efficiency } = pattern;

  // Generate material-based colors
  const getMaterialColor = (material) => {
    const materialColors = {
      'ACCIAIO': '#8B4513', // Brown
      'ALLUMINIO': '#C0C0C0', // Silver
      'RAME': '#B87333', // Copper
      'OTTONE': '#E6B800', // Brass
      'FERRO': '#696969', // Dark gray
      'PLASTICA': '#FF6B6B', // Red
      'VETRO': '#87CEEB', // Sky blue
    };
    return materialColors[material?.toUpperCase()] || stringToColor(material || 'default');
  };

  const materialColor = getMaterialColor(roll.material);

  return (
    <div className="border-2 border-gray-200 rounded-xl p-6 bg-gradient-to-br from-gray-50 to-white shadow-lg">
      {/* Header with roll info */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div 
              className="w-4 h-4 rounded-full border-2 border-gray-300"
              style={{ backgroundColor: materialColor }}
            />
            <h4 className="font-bold text-lg text-gray-900">
              Bobina {roll.code}
            </h4>
            {pattern.isLengthCollage && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                Collage Lunghezza
              </span>
            )}
          </div>
          <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            {roll.material}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-gray-700">
            Efficienza: <span className="text-green-600">{efficiency.toFixed(1)}%</span>
          </div>
          <div className="text-xs text-gray-500">
            Sfrido: {waste}mm
          </div>
          {pattern.isLengthCollage && (
            <div className="text-xs text-blue-600 mt-1">
              Parte {pattern.cuts[0]?.collageIndex + 1} di {pattern.totalCollageLength}m
            </div>
          )}
        </div>
      </div>
      
      {/* Roll visualization with 3D effect */}
      <div className="relative mb-6">
        <div className="text-center mb-2">
          <span className="text-sm font-medium text-gray-600">Larghezza Bobina: {roll.width}mm</span>
          <div className="text-xs text-blue-600 mt-1">
            ⚠️ Vincolo: Ogni taglio deve essere ≤ {roll.width}mm (no collage larghezza)
          </div>
        </div>
        
        {/* Roll body with shadow and gradient */}
        <div className="relative">
          <div 
            className="h-16 border-2 border-gray-400 rounded-lg shadow-inner relative overflow-hidden"
            style={{ 
              background: `linear-gradient(135deg, ${materialColor}88, ${materialColor}CC, ${materialColor}88)`,
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.1)'
            }}
          >
            {/* Roll texture pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="h-full w-full" style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)'
              }} />
            </div>
            
            {/* Cuts visualization */}
            <div className="flex h-full relative">
              {cuts.map((cut, index) => {
                const cutWidth = (cut.width / roll.width) * 100;
                const cutColor = stringToColor(cut.request.orderNumber);
                
                return (
                  <div
                    key={index}
                    className="relative border-r-2 border-white/30 flex flex-col items-center justify-center text-white font-bold shadow-inner"
                    style={{
                      width: `${cutWidth}%`,
                      background: `linear-gradient(135deg, ${cutColor}DD, ${cutColor}BB)`,
                      minWidth: '80px'
                    }}
                  >
                    {/* Cut label */}
                    <div className="text-center px-1">
                      <div className="text-xs font-bold drop-shadow-sm">
                        {cut.width}mm
                      </div>
                      <div className="text-xs opacity-90 font-medium">
                        {cut.request.orderNumber}
                      </div>
                      <div className="text-xs opacity-75">
                        {cut.length}m
                      </div>
                    </div>
                    
                    {/* Cut indicator line */}
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 shadow-sm" />
                  </div>
                );
              })}
              
              {/* Waste section */}
              {waste > 0 && (
                <div
                  className="flex items-center justify-center text-red-800 font-bold border-l-2 border-red-300"
                  style={{ 
                    width: `${(waste / roll.width) * 100}%`,
                    background: 'linear-gradient(135deg, #FEE2E2, #FECACA)',
                    minWidth: '60px'
                  }}
                >
                  <div className="text-center">
                    <div className="text-xs font-bold">{waste}mm</div>
                    <div className="text-xs opacity-75">Sfrido</div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Roll edges for 3D effect */}
          <div className="absolute -left-1 top-1 bottom-1 w-2 bg-gray-300 rounded-l-lg opacity-60" />
          <div className="absolute -right-1 top-1 bottom-1 w-2 bg-gray-500 rounded-r-lg opacity-60" />
        </div>
      </div>
      
      {/* Detailed cuts information */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
          Dettagli Tagli
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {cuts.map((cut, index) => {
            const cutColor = stringToColor(cut.request.orderNumber);
            return (
              <div key={index} className="flex items-center space-x-3 p-2 bg-white rounded border">
                <div
                  className="w-4 h-4 rounded border-2 border-white shadow-sm"
                  style={{ backgroundColor: cutColor }}
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {cut.request.orderNumber}
                    {cut.isCollage && (
                      <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        Collage
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {cut.width}mm × {cut.length}m | Qty: {cut.request.quantity}
                    {cut.isCollage && (
                      <span className="ml-2 text-blue-600">
                        (Parte {cut.collageIndex + 1})
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-gray-700">
                    {((cut.width / roll.width) * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">della bobina</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Multi-roll cuts (if any) */}
        {pattern.multiRollCuts && pattern.multiRollCuts.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-300">
            <h6 className="font-semibold text-orange-700 mb-2 flex items-center">
              <div className="w-2 h-2 bg-orange-500 rounded-full mr-2" />
              Tagli Non Possibili (Vincolo Larghezza)
            </h6>
            <div className="space-y-2">
              {pattern.multiRollCuts.map((multiCut, index) => (
                <div key={index} className="p-2 bg-orange-50 rounded border border-orange-200">
                  <div className="font-medium text-orange-800">{multiCut.request.orderNumber}</div>
                  <div className="text-sm text-orange-700">{multiCut.reason}</div>
                  <div className="text-xs text-orange-600 mt-1">
                    Richiesto: {multiCut.requiredWidth}mm × {multiCut.requiredLength}m
                  </div>
                  {multiCut.canCollageInLength && (
                    <div className="text-xs text-blue-600 mt-1">
                      ⚠️ Può essere collagato in lunghezza con altre bobine
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Remaining pieces */}
        {pattern.remainingPieces && pattern.remainingPieces.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-300">
            <h6 className="font-semibold text-green-700 mb-2 flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
              Pezzi Rimanenti
            </h6>
            <div className="space-y-2">
              {pattern.remainingPieces.map((piece, index) => (
                <div key={index} className="p-2 bg-green-50 rounded border border-green-200">
                  <div className="text-sm text-green-800">{piece.description}</div>
                  <div className="text-xs text-green-600">
                    {piece.width}mm × {piece.length}m
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

