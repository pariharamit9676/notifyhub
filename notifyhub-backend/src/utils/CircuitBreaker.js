export class CircuitOpenError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CircuitOpenError';
    }
}

export class CircuitBreaker {
    constructor(action, options = {}) {
        this.action = action; // The async function to execute
        this.failureThreshold = options.failureThreshold || 3;
        this.timeout = options.timeout || 60000; // Time to wait in OPEN state before testing recovery (default 60s)
        
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.failureCount = 0;
        this.nextAttempt = Date.now();
    }

    async fire(...args) {
        if (this.state === 'OPEN') {
            if (Date.now() > this.nextAttempt) {
                // Time to test if the service is back
                this.state = 'HALF_OPEN';
                console.log(`[CircuitBreaker] State changed to HALF_OPEN. Testing recovery...`);
            } else {
                // Still in cooldown period
                throw new CircuitOpenError('Circuit is OPEN. Fast failing request.');
            }
        }

        try {
            const result = await this.action(...args);
            
            // If we succeed and were in HALF_OPEN, we fully recover
            if (this.state === 'HALF_OPEN') {
                this.state = 'CLOSED';
                this.failureCount = 0;
                console.log(`[CircuitBreaker] State changed to CLOSED. Service fully recovered.`);
            }
            
            return result;
        } catch (error) {
            this.failureCount++;
            console.error(`[CircuitBreaker] Failure ${this.failureCount}/${this.failureThreshold} - ${error.message}`);
            
            if (this.failureCount >= this.failureThreshold) {
                this.state = 'OPEN';
                this.nextAttempt = Date.now() + this.timeout;
                console.log(`[CircuitBreaker] State changed to OPEN. Circuit tripped. Cooling down for ${this.timeout}ms.`);
            }
            
            throw error;
        }
    }
}
