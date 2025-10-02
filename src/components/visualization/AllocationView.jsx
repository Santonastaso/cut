import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Progress } from '../ui';
import { formatPriority, getPriorityBadgeClass } from '../../utils/validation';
import { stringToColor } from '../../utils/calculations';

export default function AllocationView({ result }) {
  if (!result || !result.cuttingPlans) return null;

  // Group cuts by order number
  const orderCuts = {};
  
  result.cuttingPlans.forEach(materialPlan => {
    materialPlan.patterns.forEach(pattern => {
      pattern.cuts.forEach(cut => {
        const orderNumber = cut.request.orderNumber;
        if (!orderCuts[orderNumber]) {
          orderCuts[orderNumber] = {
            request: cut.request,
            totalWidth: 0,
            cuts: []
          };
        }
        
        orderCuts[orderNumber].totalWidth += cut.width;
        orderCuts[orderNumber].cuts.push({
          pattern: pattern,
          cut: cut
        });
      });
    });
  });

  return (
    <div className="space-y-6">
      {Object.entries(orderCuts).map(([orderNumber, orderData]) => {
        const priorityText = formatPriority(orderData.request.priority);
        const priorityClass = getPriorityBadgeClass(orderData.request.priority);
        
        // Calculate progress
        const totalRequiredWidth = orderData.request.width * orderData.request.quantity;
        const progressPercent = Math.min(100, (orderData.totalWidth / totalRequiredWidth) * 100);

        const orderColor = stringToColor(orderNumber);
        
        return (
          <Card key={orderNumber} className="border-l-4 shadow-lg" style={{ borderLeftColor: orderColor }}>
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md"
                    style={{ backgroundColor: orderColor }}
                  >
                    {orderNumber.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${priorityClass}`}>
                        {priorityText}
                      </span>
                      <CardTitle className="text-xl text-gray-900">
                        {orderNumber}
                      </CardTitle>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {orderData.request.material} • {orderData.request.width}mm × {orderData.request.length}m
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {orderData.cuts.length} tagli
                  </div>
                  <div className="text-sm text-gray-600">
                    Qty: {orderData.request.quantity}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 space-y-3">
                <div className="flex justify-between text-sm font-medium">
                  <span>Progresso Allocazione</span>
                  <span className="text-blue-600">{progressPercent.toFixed(0)}%</span>
                </div>
                <Progress 
                  value={progressPercent} 
                  className="h-3 bg-gray-200"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Allocato: <span className="font-semibold text-green-600">{orderData.totalWidth}mm</span></span>
                  <span>Richiesto: <span className="font-semibold">{totalRequiredWidth}mm</span></span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="bg-gray-50">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left py-3 font-semibold text-gray-700">Bobina</th>
                      <th className="text-left py-3 font-semibold text-gray-700">Fascia</th>
                      <th className="text-left py-3 font-semibold text-gray-700">Lunghezza</th>
                      <th className="text-left py-3 font-semibold text-gray-700">Efficienza</th>
                      <th className="text-left py-3 font-semibold text-gray-700">Sfrido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderData.cuts.map((item, index) => (
                      <tr key={index} className="border-b border-gray-200 hover:bg-white transition-colors">
                        <td className="py-3 font-medium text-gray-900">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: stringToColor(item.pattern.roll.code) }}
                            />
                            <span>{item.pattern.roll.code}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className="font-semibold text-blue-600">{item.cut.width}mm</span>
                        </td>
                        <td className="py-3">
                          <span className="font-semibold text-green-600">{item.cut.length}m</span>
                        </td>
                        <td className="py-3">
                          <span className={`font-semibold ${item.pattern.efficiency >= 90 ? 'text-green-600' : item.pattern.efficiency >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {item.pattern.efficiency.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3">
                          <span className="font-semibold text-red-600">{item.pattern.waste}mm</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

