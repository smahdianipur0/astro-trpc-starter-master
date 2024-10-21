import { useState } from "react";
import { trpc } from "../utils/trpc";
import useSWRMutation from "swr/mutation";

function Profile() {
  const [name, setName] = useState("OldMate");

  const updateUser =  async (newData: string) => {
    const response = await trpc.greetWithName.mutate({
      names: newData,
    });
    return response;
  };

  const { data, error, trigger, isMutating } = useSWRMutation(name, updateUser);

  return (
    <div>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button
        // disabled={isMutating || name === ""}
        onClick={async () => {
          await trigger();
          // setName("");
        }}
      >Greet
      </button>
      {error && <div>Error loading greeting.</div>}
      {isMutating && <div>Loading...</div>}
      {!isMutating && data && <div>{data.message}</div>}
    </div>
  );
}

export default Profile;