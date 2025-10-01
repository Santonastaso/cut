import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Progress } from '../ui';
import { formatPriority, getPriorityBadgeClass } from '../../utils/validation';

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

        return (
          <Card key={orderNumber}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityClass}`}>
                    {priorityText}
                  </span>
                  <CardTitle className="text-lg">
                    {orderNumber} - {orderData.request.material}
                  </CardTitle>
                </div>
                <div className="text-sm text-gray-600">
                  Larghezza: {orderData.request.width}mm × Lunghezza: {orderData.request.length}m
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso Allocazione</span>
                  <span>{progressPercent.toFixed(0)}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Allocato: {orderData.totalWidth}mm</span>
                  <span>Richiesto: {totalRequiredWidth}mm</span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Bobina</th>
                      <th className="text-left py-2">Fascia</th>
                      <th className="text-left py-2">Lunghezza</th>
                      <th className="text-left py-2">Efficienza</th>
                      <th className="text-left py-2">Sfrido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderData.cuts.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2 font-medium">{item.pattern.roll.code}</td>
                        <td className="py-2">{item.cut.width}mm</td>
                        <td className="py-2">{item.cut.length}m</td>
                        <td className="py-2">{item.pattern.efficiency.toFixed(2)}%</td>
                        <td className="py-2">{item.pattern.waste}mm</td>
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

