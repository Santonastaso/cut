// Import all algorithms
import { BaseAlgorithm } from './baseAlgorithm';
import { BidimensionalAlgorithm } from './bidimensionalAlgorithm';
import { WasteMinimizationAlgorithm } from './wasteMinimizationAlgorithm';
import { PriorityAlgorithm } from './priorityAlgorithm';
import { RollMinimizationAlgorithm } from './rollMinimizationAlgorithm';
import { MultiObjectiveAlgorithm } from './multiObjectiveAlgorithm';
import { ColumnGenerationAlgorithm } from './columnGenerationAlgorithm';

// Export all algorithms
export { BaseAlgorithm };
export { BidimensionalAlgorithm };
export { WasteMinimizationAlgorithm };
export { PriorityAlgorithm };
export { RollMinimizationAlgorithm };
export { MultiObjectiveAlgorithm };
export { ColumnGenerationAlgorithm };

// Algorithm registry
export const ALGORITHMS = {
  bidimensional: {
    name: 'Combinazione Lunghezze (Ottimizzazione Bidimensionale)',
    description: 'Questo algoritmo avanzato ottimizza sia la larghezza che la lunghezza delle bobine. Prima determina il pattern ottimale di taglio in larghezza, poi combina diverse bobine per raggiungere la lunghezza totale richiesta per ciascuna fascia, minimizzando lo spreco complessivo.',
    class: BidimensionalAlgorithm,
    hasSettings: false
  },
  'waste-min': {
    name: 'Minimizzazione Sfrido (ILP)',
    description: 'Questo algoritmo di programmazione lineare intera (ILP) si focalizza sulla riduzione al minimo dello sfrido totale di materiale. Considera tutte le possibili combinazioni di tagli per trovare quella che minimizza gli sprechi sia in larghezza che in lunghezza.',
    class: WasteMinimizationAlgorithm,
    hasSettings: false
  },
  priority: {
    name: 'Priorità Ordini (ILP)',
    description: 'Questo algoritmo ILP privilegia la soddisfazione degli ordini ad alta priorità, anche a costo di generare più sfrido. Utilizza un sistema di pesi per massimizzare il completamento degli ordini più importanti.',
    class: PriorityAlgorithm,
    hasSettings: true
  },
  'roll-min': {
    name: 'Minimizzazione Bobine (ILP)',
    description: 'Questo algoritmo ILP mira a utilizzare il minor numero possibile di bobine per soddisfare le richieste. Ottimizza il numero di bobine utilizzate, anche a costo di generare un po\' più di sfrido.',
    class: RollMinimizationAlgorithm,
    hasSettings: true
  },
  multi: {
    name: 'Multi-obiettivo (ILP)',
    description: 'Questo algoritmo ILP avanzato permette di bilanciare diversi obiettivi di ottimizzazione contemporaneamente: minimizzazione dello sfrido, priorità degli ordini e minimizzazione del numero di bobine utilizzate. È possibile regolare i pesi per personalizzare l\'ottimizzazione in base alle esigenze.',
    class: MultiObjectiveAlgorithm,
    hasSettings: true
  },
  'column-gen': {
    name: 'Generazione Colonne (ILP Avanzato)',
    description: 'Questo algoritmo ILP avanzato utilizza la tecnica della generazione di colonne per risolvere problemi di grandi dimensioni. Genera iterativamente pattern di taglio promettenti e li integra nel problema principale, permettendo di ottenere soluzioni quasi ottime anche per problemi molto complessi.',
    class: ColumnGenerationAlgorithm,
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

