import { Queue } from 'bullmq';
import { createRedisConnection } from '../config/redis.js';

// Create a new queue instance named 'pushQueue'
export const pushQueue = new Queue('pushQueue', { 
    connection: createRedisConnection() 
});

/**
 * Utility to calculate options
 */
const getJobOptions = (priorityString, scheduledTime) => {
    let priorityNum = 50; // medium
    if (priorityString === 'high') priorityNum = 1;
    if (priorityString === 'low') priorityNum = 100;

    let delay = 0;
    if (scheduledTime) {
        const diff = new Date(scheduledTime).getTime() - Date.now();
        if (diff > 0) delay = diff;
    }

    return {
        priority: priorityNum,
        delay,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
        removeOnFail: false
    };
};

/**
 * Add a single push job to the queue
 */
export const addPushJob = async (jobData, priority, scheduledTime) => {
    return await pushQueue.add('send-push', jobData, getJobOptions(priority, scheduledTime));
};

/**
 * Add multiple push jobs to the queue at once
 */
export const addBulkPushJobs = async (jobsArray, priority, scheduledTime) => {
    const opts = getJobOptions(priority, scheduledTime);
    
    const jobs = jobsArray.map(data => ({
        name: 'send-push',
        data,
        opts
    }));
    
    return await pushQueue.addBulk(jobs);
};
