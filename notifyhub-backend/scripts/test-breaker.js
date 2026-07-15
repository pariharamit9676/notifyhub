import { CircuitBreaker, CircuitOpenError } from './src/utils/CircuitBreaker.js';

const failFunction = async () => {
    throw new Error('Fake API Error');
};

const breaker = new CircuitBreaker(failFunction, { failureThreshold: 3, timeout: 2000 });

async function test() {
    for (let i = 1; i <= 5; i++) {
        try {
            console.log(`Attempt ${i}...`);
            await breaker.fire();
        } catch (e) {
            if (e instanceof CircuitOpenError) {
                console.log(`[TEST] Blocked by Circuit Breaker:`, e.message);
            } else {
                console.log(`[TEST] Normal Error:`, e.message);
            }
        }
    }
}
test();
