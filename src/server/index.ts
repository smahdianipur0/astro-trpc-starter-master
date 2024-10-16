import {initTRPC} from "@trpc/server";
import superjson from 'superjson';
import type {Context} from "../trpc-common/context.ts";
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
        .query(async (): { bye: string } => ({
             bye: "Hello tRPC!",
        })),


    greetWithName: t.procedure
        .input(
            z.object({
                names: z.string(),
            }),
        )
        .mutation(async ({ input }) => {
            await new Promise(resolve => setTimeout(resolve, 2000));
            return { message: `Hello ${input.names}!!` };
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
            // User exists, increment the NumberOfVaults  
            await xata.db.users.update(input.id, {  
                NumberOfVaults: existingUser.NumberOfVaults + 1,  
            });  
            return { message: `Incremented NumberOfVaults for ${input.id}!!` };  
        } else {  
            // User does not exist, create a new user  
            await xata.db.users.create({  
                id: input.id,  
                NumberOfVaults: 1,  
            });  
            return { message: `Added ${input.id}!!` };  
        }  
    }),
        

});



export type AppRouter = typeof appRouter;

