import { createMutation,QueryClient,QueryClientProvider,} from "@tanstack/solid-query";
import { trpc } from "../utils/trpc";
import { createSignal, Switch, Match } from "solid-js";

function Example() {
  const [name, setName] = createSignal("OldMate");

  document.getElementById("comiunicate")!.addEventListener("input", (e) => {
    if ((e!.target as HTMLInputElement).matches("#inputName")) {
      const value = (e!.target as HTMLInputElement).value;
      setName(value.toString());
    }
  });

  document.getElementById("comiunicate")!.addEventListener("click", (e) => {
    if ((e!.target as HTMLInputElement).matches("#sendName")) {
      mutation.mutate(name());
    }
  });

  const mutation = createMutation(() => ({
    mutationKey: ["TanStack Query"],
    mutationFn: async (newData) => {
      const response = await trpc.greetWithName.mutate({
        names: newData,
      });
      return response;
    },
  }));

  return (
    <div>
      <Switch>
        <Match when={mutation.isPending}>
          <div>Loading...</div>
        </Match>
        <Match when={mutation.isError}>
          <div>Error: {mutation.error.message}</div>
        </Match>
        <Match when={mutation.isSuccess}>
          <div>{mutation.data?.message}</div>
        </Match>
      </Switch>
    </div>
  );
}

const client = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={client}>
      <Example />
    </QueryClientProvider>
  );
}

export default App;
