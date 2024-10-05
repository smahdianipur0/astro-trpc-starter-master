import {initTRPC} from "@trpc/server";
import superjson from 'superjson';
import type {Context} from "../trpc-common/context.ts";
import { z } from 'zod';


const t = initTRPC.context<Context>().create({
    transformer: {
        input: superjson,
        output: superjson,
    }
});

export const router = t.router;

export const appRouter = router({
    greeting: t.procedure.query(async (): { bye: string } => ({
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
    })

});


export type AppRouter = typeof appRouter;

