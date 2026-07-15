import { Queue } from 'bullmq';
import { createRedisConnection } from '../config/redis.js';

// Create a new queue instance named 'emailQueue'
export const emailQueue = new Queue('emailQueue', { 
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
 * Add a single email job to the queue
 */
export const addEmailJob = async (jobData, priority, scheduledTime) => {
    return await emailQueue.add('send-email', jobData, getJobOptions(priority, scheduledTime));
};

/**
 * Add multiple email jobs to the queue at once
 */
export const addBulkEmailJobs = async (jobsArray, priority, scheduledTime) => {
    const opts = getJobOptions(priority, scheduledTime);
    
    const jobs = jobsArray.map(data => ({
        name: 'send-email',
        data,
        opts
    }));
    
    return await emailQueue.addBulk(jobs);
};
