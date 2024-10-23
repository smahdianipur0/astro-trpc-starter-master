import {initTRPC} from "@trpc/server";
import superjson from 'superjson';
import type {Context} from "./context.ts";
import { z } from 'zod';
import { XataClient } from '../xata';


const xata = new XataClient({
  apiKey: import.meta.env.XATA_API_KEY,
  branch: import.meta.env.XATA_BRANCH
});


const t = initTRPC.context<Context>().create({
    transformer: {
        input: superjson,
        output: superjson,
    }
});

export const router = t.router;

export const appRouter = router({

    greeting: t.procedure
      .query(async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return { bye: "Hello tRPC!!" };
      }),


    greetWithName: t.procedure
    .input(  
        z.object({  
            names: z.string(),  
        }),  
    )  
    .mutation(async ({ input }) => {  
        if (input.names === "OldMate") {  // Change from input.name to input.names  
            return { message: `Hello!!` };  
        } else {  
            await new Promise(resolve => setTimeout(resolve, 2000));  
            return { message: `Hello ${input.names}!!` };  
        }  
    }),  

        
addUser: t.procedure  
    .input(  
        z.object({  
            id: z.string(),  
        }),  
    )  
    .mutation(async ({ input }) => {  
        const existingUser = await xata.db.users.read(input.id);  

        if (existingUser) {  
            await xata.db.users.update(input.id, {  
                NumberOfVaults: (existingUser.NumberOfVaults ?? 0) + 1,  
            });  
            return { message: `Incremented NumberOfVaults for ${input.id}!!` };  
        } else {  
            await xata.db.users.create({  
                id: input.id,  
                NumberOfVaults: 1,  
            });  
            return { message: `Added ${input.id}!!` };  
        }  
    }),

});



export type AppRouter = typeof appRouter;

