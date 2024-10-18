import { trpcAstroClient } from "../client";  
import cacheUtil from '../components/cacheUtil.ts'; 


const displayGreeting = async () => {  
    try {  
        document.getElementById("byebye").textContent = "Loading..."
        const data = await cacheUtil.swr("greeting", async () => {  
            return await trpcAstroClient.greeting.query();  
        });  

        if (data && data.bye) {  
            document.getElementById("byebye")!.textContent = data.bye;  
        } else {  
            console.error("No data received");  
        }  
    } catch (error) {  
        document.getElementById("byebye")!.textContent = "Error loading greeting.";  
    }  
};  


displayGreeting();