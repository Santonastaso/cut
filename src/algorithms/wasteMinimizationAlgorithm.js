import { BaseAlgorithm } from './baseAlgorithm.js';

/**
 * Simple Waste Optimization Algorithm
 * Matches stock rectangles with requests and creates cutting patterns
 * Based on client requirements: optimize waste by pairing rectangles
 */
export class WasteMinimizationAlgorithm extends BaseAlgorithm {
  constructor() {
    super(
      'WasteMinimization',
      'Ottimizzazione Sfridi'
    );
  }

  optimize(stockRolls, cutRequests, settings = {}) {
    // Input validation
    if (!stockRolls || !cutRequests || stockRolls.length === 0 || cutRequests.length === 0) {
      return {
        cuttingPlans: [],
        statistics: {
          efficiency: '0.00',
          totalWaste: '0.00',
          rollsUsed: 0,
          totalRolls: stockRolls?.length || 0,
          fulfilledRequests: 0,
          totalRequests: cutRequests?.reduce((sum, req) => sum + req.quantity, 0) || 0
        }
      };
    }

    // Group requests by material type
    const requestsByMaterial = this.groupRequestsByMaterial(cutRequests);
    const cuttingPlans = [];
    let totalWaste = 0;
    let totalEfficiency = 0;
    let usedRolls = 0;
    let totalFulfilledRequests = 0;
    
    // Calculate total requests before processing (quantities will be modified)
    const totalRequests = cutRequests.reduce((sum, req) => sum + req.quantity, 0);

    // Process each material type separately
    Object.entries(requestsByMaterial).forEach(([material, materialRequests]) => {
      const availableRolls = stockRolls.filter(roll => roll.material === material);
      if (!availableRolls.length) return;

      const materialResult = this.optimizeMaterial(availableRolls, materialRequests);
      
      if (materialResult.patterns.length > 0) {
        cuttingPlans.push(materialResult);
        totalWaste += parseFloat(materialResult.statistics.totalWaste);
        totalEfficiency += parseFloat(materialResult.statistics.efficiency) * materialResult.patterns.length;
        usedRolls += materialResult.patterns.length;
        totalFulfilledRequests += materialResult.statistics.fulfilledRequests;
        
        console.log(`Material ${material}: ${materialResult.statistics.fulfilledRequests} fulfilled requests`);
      }
    });

    const planEfficiency = usedRolls > 0 ? totalEfficiency / usedRolls : 0;

    console.log(`=== Final Optimization Results ===`);
    console.log(`Total fulfilled requests: ${totalFulfilledRequests}`);
    console.log(`Total requests: ${totalRequests}`);
    console.log(`Used rolls: ${usedRolls}`);
    console.log(`Total waste: ${totalWaste}`);

    return {
      cuttingPlans,
      statistics: {
        efficiency: planEfficiency.toFixed(2),
        totalWaste: totalWaste.toFixed(2),
        rollsUsed: usedRolls,
        totalRolls: stockRolls.length,
        fulfilledRequests: totalFulfilledRequests,
        totalRequests: totalRequests
      }
    };
  }

  optimizeMaterial(availableRolls, materialRequests) {
    // Sort requests by priority and width (descending)
    const sortedRequests = this.sortRequestsByPriority([...materialRequests]);
    
    // Sort rolls by width (descending) to use larger rolls first
    const sortedRolls = this.sortRollsByWidth([...availableRolls]);
    
    const patterns = [];
    let totalFulfilledRequests = 0;
    let unfulfilledRequests = [];
    const fulfilledRequestIds = new Set(); // Track which requests have been fulfilled

    // Process each roll following the algorithm sketch
    for (const roll of sortedRolls) {
      // Check if there are any remaining requests
      const hasRemainingRequests = sortedRequests.some(req => req.quantity > 0);
      if (!hasRemainingRequests) break;

      console.log(`Processing roll ${roll.code}: ${roll.width}mm × ${roll.length}m`);
      console.log('Remaining requests:', sortedRequests.filter(req => req.quantity > 0));

      // Create pattern for this roll
      const pattern = this.createCuttingPattern(roll, sortedRequests);
      
      console.log(`Pattern for roll ${roll.code}: ${pattern.cuts.length} cuts, ${pattern.multiRollCuts.length} multi-roll cuts`);
      
      // Only add patterns with actual cuts to results
      if (pattern.cuts.length > 0) {
        patterns.push(pattern);
        // Count unique requests fulfilled, not individual cuts
        pattern.cuts.forEach(cut => {
          if (!fulfilledRequestIds.has(cut.request.id)) {
            fulfilledRequestIds.add(cut.request.id);
            totalFulfilledRequests += 1;
          }
        });
      }
      
      // Handle multi-roll cuts by trying to fulfill them with remaining rolls
      if (pattern.multiRollCuts.length > 0) {
        this.handleMultiRollOptimization(pattern, sortedRolls, sortedRequests);
      }
    }

    // After processing all rolls, try to fulfill remaining requests with length collage
    this.attemptLengthCollageForRemainingRequests(sortedRequests, sortedRolls, patterns, fulfilledRequestIds);

    // Recalculate total fulfilled requests after length collage (count unique requests, not cuts)
    totalFulfilledRequests = fulfilledRequestIds.size;

    // Collect unfulfilled requests
    unfulfilledRequests = sortedRequests.filter(req => req.quantity > 0);

    const totalWaste = patterns.reduce((sum, pattern) => sum + pattern.waste, 0);
    const totalArea = patterns.reduce((sum, pattern) => sum + (pattern.roll.width * pattern.roll.length * 1000), 0);
    const usedArea = patterns.reduce((sum, pattern) => sum + pattern.usedArea, 0);
    const efficiency = totalArea > 0 ? (usedArea / totalArea) * 100 : 0;

    console.log(`Final statistics: ${totalFulfilledRequests} fulfilled requests, ${unfulfilledRequests.length} unfulfilled`);

    return {
      material: availableRolls[0].material,
      patterns,
      unfulfilledRequests,
      statistics: {
        efficiency: efficiency.toFixed(2),
        totalWaste: (totalWaste / 1000000).toFixed(2), // Convert mm² to m²
        fulfilledRequests: totalFulfilledRequests,
        unfulfilledRequests: unfulfilledRequests.length
      }
    };
  }

  /**
   * Handle multi-roll optimization for requests that don't fit in single roll
   * Following the algorithm: if W+Q>X, find second bobina M with width(M)>=W+Q
   */
  handleMultiRollOptimization(pattern, availableRolls, requests) {
    for (const multiRollCut of pattern.multiRollCuts) {
      const request = multiRollCut.request;
      
      // Check if this is a length collage case (width fits, but length doesn't)
      if (request.width <= pattern.roll.width && request.length > pattern.roll.length) {
        // This can be handled with length collage
        this.attemptLengthCollageForRequest(request, availableRolls, pattern.roll);
      } else if (request.width > pattern.roll.width) {
        // Find a roll that can accommodate this request's width
        const suitableRoll = availableRolls.find(roll => 
          roll.id !== pattern.roll.id && 
          roll.width >= request.width && 
          roll.length >= request.length
        );

        if (suitableRoll) {
          // Create a new pattern for this roll
          const newPattern = this.createCuttingPattern(suitableRoll, [request]);
          if (newPattern.cuts.length > 0) {
            console.log(`Multi-roll cut: ${request.orderNumber} moved to roll ${suitableRoll.code}`);
          }
        } else {
          console.log(`Cannot fulfill request ${request.orderNumber}: no suitable roll available`);
        }
      }
    }
  }

  /**
   * Attempt to fulfill a request using length collage
   * This combines multiple rolls to fulfill a single request that's too long for one roll
   */
  attemptLengthCollageForRequest(request, availableRolls, currentRoll) {
    // Find rolls that can accommodate this request's width
    const suitableRolls = availableRolls.filter(roll => 
      roll.width >= request.width && 
      roll.id !== currentRoll.id // Don't use the current roll
    );

    if (suitableRolls.length === 0) {
      console.log(`Cannot fulfill request ${request.orderNumber}: no suitable rolls for length collage`);
      return;
    }

    // Sort by length (descending) to use longer rolls first
    suitableRolls.sort((a, b) => b.length - a.length);

    let remainingLength = request.length;
    const collageRolls = [];

    // Try to fulfill the request by combining multiple rolls
    for (const roll of suitableRolls) {
      if (remainingLength <= 0) break;

      const cutLength = Math.min(remainingLength, roll.length);
      collageRolls.push({ roll, cutLength });
      remainingLength -= cutLength;
    }

    if (remainingLength <= 0) {
      // Successfully can create length collage
      console.log(`Length collage possible for ${request.orderNumber}: using ${collageRolls.length} rolls`);
      // Note: The actual collage patterns would be created in the main optimization loop
    } else {
      console.log(`Cannot fulfill request ${request.orderNumber}: insufficient total length. Still need ${remainingLength}m`);
    }
  }

  /**
   * Attempt to fulfill remaining requests using length collage
   * This is called after all individual roll processing is complete
   */
  attemptLengthCollageForRemainingRequests(remainingRequests, availableRolls, patterns, fulfilledRequestIds) {
    console.log('=== Attempting Length Collage ===');
    console.log('Remaining requests:', remainingRequests.filter(req => req.quantity > 0));
    console.log('Available rolls:', availableRolls.map(roll => ({ code: roll.code, width: roll.width, length: roll.length })));
    
    // First, check for partial cuts that need completion
    for (const pattern of patterns) {
      for (const cut of pattern.cuts) {
        if (cut.isPartialCut && cut.remainingLength > 0) {
          console.log(`Found partial cut for ${cut.request.orderNumber}: ${cut.remainingLength}m remaining`);
          
          // Create a modified request for the remaining length
          const remainingRequest = {
            ...cut.request,
            length: cut.remainingLength,
            id: `${cut.request.id}_remaining_${cut.remainingLength}`
          };
          
          const collageResult = this.createLengthCollage(remainingRequest, availableRolls, patterns);
          console.log('Partial cut collage result:', collageResult);
          
          if (collageResult.success) {
            // Mark the original request as fulfilled
            fulfilledRequestIds.add(cut.request.id);
            console.log(`Partial cut completed for ${cut.request.orderNumber}`);
          } else {
            console.log(`Partial cut failed for ${cut.request.orderNumber}: ${collageResult.reason}`);
          }
        }
      }
    }
    
    // Then handle remaining requests
    for (const request of remainingRequests) {
      if (request.quantity <= 0) continue;
      
      console.log(`Processing request: ${request.orderNumber} - ${request.width}mm × ${request.length}m`);
      
      // Check if this request can be fulfilled with length collage
      if (request.width <= Math.max(...availableRolls.map(roll => roll.width))) {
        console.log(`Request width ${request.width}mm fits in available rolls`);
        const collageResult = this.createLengthCollage(request, availableRolls, patterns);
        console.log('Collage result:', collageResult);
        
        if (collageResult.success) {
          request.quantity -= 1;
          fulfilledRequestIds.add(request.id);
          console.log(`Length collage successful for ${request.orderNumber}`);
        } else {
          console.log(`Length collage failed for ${request.orderNumber}: ${collageResult.reason}`);
        }
      } else {
        console.log(`Request width ${request.width}mm too wide for available rolls`);
      }
    }
  }

  /**
   * Create a length collage pattern using multiple rolls
   */
  createLengthCollage(request, availableRolls, patterns) {
    console.log(`Creating length collage for ${request.orderNumber}: ${request.width}mm × ${request.length}m`);
    
    // Find rolls that can accommodate this request's width
    // We can use rolls that have cuts if they have remaining length available
    const suitableRolls = availableRolls.filter(roll => {
      if (roll.width < request.width) return false;
      
      // Check if this roll has a pattern with cuts
      const existingPattern = patterns.find(pattern => pattern.roll.id === roll.id);
      if (!existingPattern || existingPattern.cuts.length === 0) {
        // Roll has no cuts, can use full length
        return true;
      }
      
      // Roll has cuts, check if we can add a new cut alongside existing ones
      // FIXED: For parallel cuts, we can always use the full length
      // The key constraint is width, not length
      const totalWidthUsed = existingPattern.cuts.reduce((sum, cut) => sum + cut.width, 0);
      const remainingWidth = roll.width - totalWidthUsed;
      
      // Can use this roll if there's remaining width available for parallel cuts
      return remainingWidth >= request.width;
    });

    console.log('Suitable rolls for collage:', suitableRolls.map(roll => {
      const existingPattern = patterns.find(pattern => pattern.roll.id === roll.id);
      const totalWidthUsed = existingPattern ? existingPattern.cuts.reduce((sum, cut) => sum + cut.width, 0) : 0;
      const remainingWidth = roll.width - totalWidthUsed;
      return { 
        code: roll.code, 
        width: roll.width, 
        length: roll.length,
        remainingWidth: remainingWidth,
        hasCuts: existingPattern && existingPattern.cuts.length > 0
      };
    }));
    console.log('Used rolls (with cuts):', patterns.filter(p => p.cuts.length > 0).map(p => p.roll.code));

    if (suitableRolls.length === 0) {
      console.log('No suitable rolls available for collage');
      return { success: false, reason: 'No suitable rolls available' };
    }

    // Sort by length (descending) to use longer rolls first
    suitableRolls.sort((a, b) => b.length - a.length);

    let remainingLength = request.length;
    const collagePatterns = [];

    console.log(`Starting collage with ${remainingLength}m to fulfill`);

    for (const roll of suitableRolls) {
      if (remainingLength <= 0) break;

      // Check if this roll already has cuts
      const existingPattern = patterns.find(pattern => pattern.roll.id === roll.id);
      let availableLength = roll.length;
      let cutPosition = { x: 0, y: 0 };
      
      if (existingPattern && existingPattern.cuts.length > 0) {
        // Roll has existing cuts, calculate remaining length and position
        // FIXED: For parallel cuts, we can use the full roll length since cuts don't interfere in length
        // Each cut can use the full length of the roll independently
        availableLength = roll.length;
        
        // Calculate position for parallel cut (alongside existing cuts)
        const totalWidthUsed = existingPattern.cuts.reduce((sum, cut) => sum + cut.width, 0);
        cutPosition = { x: totalWidthUsed, y: 0 };
        
        console.log(`Roll ${roll.code} has existing cuts, available length: ${availableLength}m (full length for parallel cuts), position: x=${cutPosition.x}`);
      }

      const cutLength = Math.min(remainingLength, availableLength);
      console.log(`Using roll ${roll.code}: cutting ${cutLength}m (remaining: ${remainingLength - cutLength}m)`);
      
      if (cutLength <= 0) continue; // Skip if no length available
      
      // Check if we need to create a new pattern or add to existing one
      if (existingPattern && existingPattern.cuts.length > 0) {
        // Add to existing pattern
        const newCut = {
          request: request,
          width: request.width,
          length: cutLength,
          position: cutPosition,
          rollId: roll.id,
          isCollage: true,
          collageIndex: collagePatterns.length
        };
        
        existingPattern.cuts.push(newCut);
        existingPattern.usedArea += request.width * cutLength * 1000;
        
        // Recalculate waste and efficiency for the updated pattern
        this.calculateWasteAndRemainingPieces(existingPattern);
        
        console.log(`Added collage cut to existing pattern for roll ${roll.code}`);
      } else {
        // Create a new pattern for this roll
        const pattern = {
          roll: roll,
          cuts: [{
            request: request,
            width: request.width,
            length: cutLength,
            position: cutPosition,
            rollId: roll.id,
            isCollage: true,
            collageIndex: collagePatterns.length
          }],
          waste: 0,
          usedArea: request.width * cutLength * 1000,
          efficiency: 0,
          remainingPieces: [],
          multiRollCuts: [],
          isLengthCollage: true,
          totalCollageLength: request.length
        };

        // Calculate waste and efficiency for this collage piece
        this.calculateWasteAndRemainingPieces(pattern);
        
        collagePatterns.push(pattern);
      }
      
      remainingLength -= cutLength;
    }

    console.log(`Collage complete. Remaining length: ${remainingLength}m`);

    if (remainingLength <= 0) {
      // Successfully created collage
      console.log(`Adding ${collagePatterns.length} new collage patterns to results`);
      // Only add new patterns (not existing ones that were modified)
      patterns.push(...collagePatterns);
      
      // Mark the request as fulfilled (this will be handled by the calling method)
      console.log(`Request ${request.orderNumber} fulfilled via length collage`);
      
      return { success: true, patterns: collagePatterns };
    } else {
      return { success: false, reason: `Insufficient total length. Still need ${remainingLength}m` };
    }
  }

  /**
   * Create cutting pattern following the client's algorithm sketch
   * Case study: Roll P (width X, length Y) for rectangles A (W×L) and B (Q×H)
   */
  createCuttingPattern(roll, availableRequests) {
    console.log(`Creating cutting pattern for roll ${roll.code}: ${roll.width}mm × ${roll.length}m`);
    
    const pattern = {
      roll: roll,
      cuts: [],
      waste: 0,
      usedArea: 0,
      efficiency: 0,
      remainingPieces: [],
      multiRollCuts: [] // For cuts that span multiple rolls
    };

    // Filter requests that can fit in this roll's width
    const fittingRequests = availableRequests.filter(req => 
      req.quantity > 0 && req.width <= roll.width
    );

    console.log(`Fitting requests for roll ${roll.code}:`, fittingRequests.map(req => ({ order: req.orderNumber, width: req.width, length: req.length, qty: req.quantity })));

    if (fittingRequests.length === 0) {
      console.log(`No fitting requests for roll ${roll.code}`);
      return pattern; // No cuts possible
    }

    // Sort by priority and width (descending)
    const sortedRequests = this.sortRequestsByPriority(fittingRequests);

    // Process requests following the algorithm sketch
    for (const request of sortedRequests) {
      if (request.quantity <= 0) continue;
      
      console.log(`Processing request ${request.orderNumber}: ${request.width}mm × ${request.length}m`);

      // Check if this request fits in the current roll
      const canFitInCurrentRoll = this.canFitInRoll(roll, request, pattern.cuts);
      console.log(`Can fit in current roll:`, canFitInCurrentRoll);
      
      if (canFitInCurrentRoll.fits) {
        // Add cut to current roll
        console.log(`Adding cut to pattern for ${request.orderNumber}`);
        
        // Check if this is a partial cut (shorter length than requested)
        if (canFitInCurrentRoll.partialCut) {
          console.log(`Adding partial cut: ${canFitInCurrentRoll.cutLength}m instead of ${request.length}m`);
          this.addPartialCutToPattern(pattern, request, canFitInCurrentRoll);
          // Don't reduce quantity yet - this will be handled by length collage
        } else {
          this.addCutToPattern(pattern, request, canFitInCurrentRoll);
          request.quantity -= 1;
        }
      } else {
        // Check if we need multiple rolls for this request
        if (canFitInCurrentRoll.needsMultipleRolls) {
          console.log(`Adding to multi-roll cuts for ${request.orderNumber}`);
          this.handleMultiRollCut(pattern, request, availableRequests);
        }
        // If it doesn't fit at all, skip this request
      }
    }

    // Calculate waste and remaining pieces following the sketch
    this.calculateWasteAndRemainingPieces(pattern);

    console.log(`Final pattern for roll ${roll.code}: ${pattern.cuts.length} cuts, ${pattern.multiRollCuts.length} multi-roll cuts`);
    return pattern;
  }

  /**
   * Check if a request can fit in the current roll
   * CRITICAL CONSTRAINT: Can only collage in length, NOT in width
   * Each cut must fit entirely within the roll's width
   * BUT: Multiple cuts can be made in parallel with different lengths
   */
  canFitInRoll(roll, request, existingCuts) {
    // CRITICAL: Each individual request must fit in the roll's width
    // No width collage allowed - each piece must be ≤ roll.width
    if (request.width > roll.width) {
      return { 
        fits: false, 
        needsMultipleRolls: true,
        reason: `Request width (${request.width}mm) exceeds roll width (${roll.width}mm)`
      };
    }

    // Check if request fits in roll length
    // NEW: Allow cutting shorter length than requested if it fits in the roll
    if (request.length > roll.length) {
      // We can still cut this request, but with a shorter length
      // This will be handled as a partial cut that can be completed with length collage
      return { 
        fits: true, 
        needsMultipleRolls: true, // Still needs multiple rolls for full length
        reason: `Request length (${request.length}m) exceeds roll length (${roll.length}m), but can cut ${roll.length}m`,
        partialCut: true,
        cutLength: roll.length
      };
    }

    // Calculate total width used by existing cuts
    const usedWidth = existingCuts.reduce((sum, cut) => sum + cut.width, 0);
    const remainingWidth = roll.width - usedWidth;

    // Check if request fits in remaining width
    if (request.width > remainingWidth) {
      return { 
        fits: false, 
        needsMultipleRolls: false, // Can't fit in this roll, but might fit in another
        reason: `Insufficient remaining width (${remainingWidth}mm) for request (${request.width}mm)`
      };
    }

    // NEW LOGIC: Allow parallel cuts with different lengths
    // Each cut can use the full roll length if needed, as long as width fits
    // We don't need to check combined length - each cut can be independent in length
    
    return { 
      fits: true, 
      needsMultipleRolls: false,
      position: { x: usedWidth, y: 0 },
      maxLength: request.length // Each cut can use its own length
    };
  }

  /**
   * Add a cut to the pattern
   */
  addCutToPattern(pattern, request, fitInfo) {
    const cut = {
      request: request,
      width: request.width,
      length: request.length,
      position: fitInfo.position,
      rollId: pattern.roll.id
    };

    pattern.cuts.push(cut);
  }

  /**
   * Add a partial cut to the pattern (shorter length than requested)
   */
  addPartialCutToPattern(pattern, request, fitInfo) {
    const cut = {
      request: request,
      width: request.width,
      length: fitInfo.cutLength, // Use the shorter length that fits
      position: fitInfo.position,
      rollId: pattern.roll.id,
      isPartialCut: true,
      originalLength: request.length,
      remainingLength: request.length - fitInfo.cutLength
    };

    pattern.cuts.push(cut);
  }

  /**
   * Handle cuts that need multiple rolls
   * CRITICAL: Can only collage in length, NOT in width
   * Each individual request must fit in a single roll's width
   */
  handleMultiRollCut(pattern, request, allRequests) {
    // CRITICAL CONSTRAINT: No width collage allowed
    // Each request must fit entirely within one roll's width
    
    let reason = '';
    let needsAdditionalRolls = false;
    
    if (request.width > pattern.roll.width) {
      reason = `Request width (${request.width}mm) exceeds roll width (${pattern.roll.width}mm) - needs wider roll`;
      needsAdditionalRolls = true;
    } else if (request.length > pattern.roll.length) {
      reason = `Request length (${request.length}m) exceeds roll length (${pattern.roll.length}m) - needs longer roll or length collage`;
      needsAdditionalRolls = true;
    } else {
      reason = `Insufficient space in current roll for request ${request.orderNumber}`;
      needsAdditionalRolls = false;
    }

    pattern.multiRollCuts.push({
      request: request,
      reason: reason,
      requiredWidth: request.width,
      requiredLength: request.length,
      availableWidth: pattern.roll.width,
      availableLength: pattern.roll.length,
      needsAdditionalRolls: needsAdditionalRolls,
      canCollageInLength: request.width <= pattern.roll.width && request.length > pattern.roll.length
    });
  }

  /**
   * Get the reason why a multi-roll cut is needed
   */
  getMultiRollReason(request, roll, totalRequiredWidth, maxRequiredLength) {
    if (request.width > roll.width) {
      return `Request width (${request.width}mm) exceeds roll width (${roll.width}mm)`;
    }
    if (request.length > roll.length) {
      return `Request length (${request.length}m) exceeds roll length (${roll.length}m)`;
    }
    if (totalRequiredWidth > roll.width) {
      return `Total required width (${totalRequiredWidth}mm) exceeds roll width (${roll.width}mm)`;
    }
    if (maxRequiredLength > roll.length) {
      return `Maximum required length (${maxRequiredLength}m) exceeds roll length (${roll.length}m)`;
    }
    return 'Insufficient space in current roll';
  }

  /**
   * Calculate waste and remaining pieces following the algorithm sketch
   * CRITICAL CONSTRAINT: Can only collage in length, NOT in width
   * Each cut must fit entirely within the roll's width
   * NEW: Multiple cuts can be made in parallel with different lengths
   */
  calculateWasteAndRemainingPieces(pattern) {
    if (pattern.cuts.length === 0) {
      pattern.waste = pattern.roll.width * pattern.roll.length * 1000; // Full roll is waste
      pattern.efficiency = 0;
      return;
    }

    // Calculate total width used (sum of all cuts in width direction)
    const totalUsedWidth = pattern.cuts.reduce((sum, cut) => sum + cut.width, 0);
    const maxLengthUsed = Math.max(...pattern.cuts.map(cut => cut.length));

    // Calculate remaining width
    const remainingWidth = pattern.roll.width - totalUsedWidth;

    // Following the algorithm sketch with width constraint:
    if (totalUsedWidth === pattern.roll.width) {
      // IF W+Q=X then finisce li - no waste in width
      pattern.waste = 0;
    } else if (totalUsedWidth < pattern.roll.width) {
      // elif W+Q<X devo visualizzare rettangolo G larga X-W-Q
      // This remaining piece goes back to stock (not waste)
      const remainingPiece = {
          type: 'remaining_stock',
          width: remainingWidth,
        length: maxLengthUsed,
        description: `Rettangolo G: larga ${remainingWidth}mm, lunga ${maxLengthUsed}m (ritorna a magazzino)`
      };
      pattern.remainingPieces.push(remainingPiece);
      pattern.waste = 0; // Not waste, goes back to stock
    }

    // Check length waste - this is where we can have remaining pieces
    const remainingLength = pattern.roll.length - maxLengthUsed;
    if (remainingLength > 0) {
      // Handle bobina splitting: if bobina is wider than needed, create two pieces
      // One piece with original width (uncut) and one with remaining width after cutting
      if (totalUsedWidth < pattern.roll.width) {
        // Create the uncut piece (original width, remaining length)
        const uncutPiece = {
          type: 'uncut_bobina',
          width: pattern.roll.width,
          length: remainingLength,
          description: `Bobina originale: larga ${pattern.roll.width}mm, lunga ${remainingLength}m (non tagliata)`
        };
        pattern.remainingPieces.push(uncutPiece);
      } else {
        // If width is fully used, just add the remaining length piece
        const lengthRemainingPiece = {
          type: 'remaining_stock',
          width: pattern.roll.width,
          length: remainingLength,
          description: `Rettangolo Z: larga ${pattern.roll.width}mm, lunga ${remainingLength}m (ritorna a magazzino)`
        };
        pattern.remainingPieces.push(lengthRemainingPiece);
      }
    }

    // Calculate efficiency based on actual cuts made
    pattern.usedArea = pattern.cuts.reduce((sum, cut) => sum + (cut.width * cut.length * 1000), 0);
    const totalArea = pattern.roll.width * pattern.roll.length * 1000;
    pattern.efficiency = totalArea > 0 ? (pattern.usedArea / totalArea) * 100 : 0;
  }
}

