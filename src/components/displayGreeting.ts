import { trpcAstroClient } from "../client";  
import cacheUtil from '../components/cacheUtil.ts'; 

const displayGreeting = async () => {  
    try {  
        const data = await cacheUtil.cacheFirst("greeting", async () => {  
            return await trpcAstroClient.greeting.query();  
        });  

        if (data && data.bye) {  
            document.getElementById("byebye")!.textContent = data.bye;  
        } else {  
            console.error("No data received");  
        }  
    } catch (error) {  
        console.error("Error loading greeting:", error);  
        document.getElementById("byebye")!.textContent = "Error loading greeting.";  
    }  
};  


// displayGreeting();

document.getElementById("comiunicate")!.addEventListener("click", (e) => {
    if ((e!.target as HTMLInputElement).matches("#saybye")) {
      displayGreeting();
    }
});