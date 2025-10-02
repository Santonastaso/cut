// Import all algorithms
import { BaseAlgorithm } from './baseAlgorithm.js';
import { WasteMinimizationAlgorithm } from './wasteMinimizationAlgorithm.js';
import { PriorityAlgorithm } from './priorityAlgorithm.js';

// Export all algorithms
export { BaseAlgorithm };
export { WasteMinimizationAlgorithm };
export { PriorityAlgorithm };

// Algorithm registry
export const ALGORITHMS = {
  'waste-optimization': {
    name: 'Ottimizzazione Sfridi',
    description: 'Algoritmo semplice per ottimizzare gli sfridi: prende tutti i rettangoli (bobine) presenti a magazzino e ottimizza la loro larghezza e lunghezza per soddisfare la domanda. Accoppia tra loro nelle diverse larghezze i rettangoli che vengono richiesti partendo dai rettangoli a magazzino.',
    class: WasteMinimizationAlgorithm,
    hasSettings: false
  },
  'priority-orders': {
    name: 'Priorità Ordini',
    description: 'Algoritmo che prioritizza le richieste ad alta priorità anche a costo di maggiore spreco. Garantisce che gli ordini urgenti vengano soddisfatti per primi, utilizzando le bobine più grandi disponibili.',
    class: PriorityAlgorithm,
    hasSettings: true
  }
};

// Get algorithm instance
export function getAlgorithm(type) {
  const algorithmConfig = ALGORITHMS[type];
  if (!algorithmConfig) {
    throw new Error(`Unknown algorithm type: ${type}`);
  }
  return new algorithmConfig.class();
}

