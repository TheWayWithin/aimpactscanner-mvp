// Circuit Breaker Pattern for Reliable Factor Analysis
// Prevents cascading failures and provides fallback values

export interface CircuitBreakerState {
  failures: number;
  lastFailTime: number;
  state: 'closed' | 'open' | 'half-open';
}

export class CircuitBreaker {
  private circuits = new Map<string, CircuitBreakerState>();
  private readonly failureThreshold = 3;
  private readonly resetTimeout = 60000; // 1 minute
  private readonly factorTimeout = 2000; // 2 seconds per factor
  
  constructor() {
    console.log('🔧 Circuit breaker initialized');
  }

  async execute<T>(
    factorId: string,
    operation: () => Promise<T>,
    fallback: T,
    timeout: number = this.factorTimeout
  ): Promise<T> {
    const circuit = this.getCircuit(factorId);
    
    // Check if circuit is open
    if (circuit.state === 'open') {
      if (this.shouldAttemptReset(circuit)) {
        circuit.state = 'half-open';
        console.log(`🔄 Circuit ${factorId} half-open, attempting reset`);
      } else {
        console.log(`⚡ Circuit ${factorId} open, using fallback`);
        return fallback;
      }
    }
    
    try {
      // Execute with timeout
      const result = await Promise.race([
        operation(),
        new Promise<T>((_, reject) => 
          setTimeout(() => reject(new Error(`Factor ${factorId} timeout`)), timeout)
        )
      ]);
      
      // Success - reset circuit
      this.onSuccess(factorId);
      return result;
      
    } catch (error) {
      // Failure - record and potentially open circuit
      this.onFailure(factorId, error);
      console.log(`❌ Factor ${factorId} failed: ${error.message}, using fallback`);
      return fallback;
    }
  }

  private getCircuit(factorId: string): CircuitBreakerState {
    if (!this.circuits.has(factorId)) {
      this.circuits.set(factorId, {
        failures: 0,
        lastFailTime: 0,
        state: 'closed'
      });
    }
    return this.circuits.get(factorId)!;
  }

  private shouldAttemptReset(circuit: CircuitBreakerState): boolean {
    return Date.now() - circuit.lastFailTime > this.resetTimeout;
  }

  private onSuccess(factorId: string): void {
    const circuit = this.getCircuit(factorId);
    circuit.failures = 0;
    circuit.lastFailTime = 0;
    circuit.state = 'closed';
    console.log(`✅ Circuit ${factorId} reset to closed`);
  }

  private onFailure(factorId: string, error: Error): void {
    const circuit = this.getCircuit(factorId);
    circuit.failures++;
    circuit.lastFailTime = Date.now();
    
    if (circuit.failures >= this.failureThreshold) {
      circuit.state = 'open';
      console.log(`🚨 Circuit ${factorId} opened after ${circuit.failures} failures`);
    }
    
    // Log error details for debugging
    console.error(`Circuit ${factorId} failure ${circuit.failures}:`, {
      error: error.message,
      state: circuit.state,
      timestamp: new Date().toISOString()
    });
  }

  // Get circuit states for monitoring
  getCircuitStates(): Record<string, CircuitBreakerState> {
    const states: Record<string, CircuitBreakerState> = {};
    for (const [factorId, state] of this.circuits.entries()) {
      states[factorId] = { ...state };
    }
    return states;
  }

  // Reset all circuits (for testing)
  resetAll(): void {
    console.log('🔄 Resetting all circuits');
    this.circuits.clear();
  }

  // Create standardized fallback values for different factor types
  createFallbackValue(
    factorId: string,
    factorName: string,
    pillar: string,
    phase: 'instant' | 'background',
    reason: string = 'Circuit breaker activated'
  ): any {
    return {
      factor_id: factorId,
      factor_name: factorName,
      pillar: pillar,
      phase: phase,
      score: 0,
      confidence: 0,
      weight: 1.0,
      evidence: [reason],
      recommendations: [`Unable to analyze ${factorName} - please check manually`],
      processing_time_ms: 0,
      cache_hit: false
    };
  }
}