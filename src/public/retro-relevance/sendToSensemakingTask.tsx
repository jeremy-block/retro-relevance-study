import { useCallback, useMemo } from "react";
import { useStoreSelector } from "../../store/store";
import { initializeTrrack, Registry } from '@trrack/core';
import { StimulusParams } from "../../store/types";
import { Button } from "@mantine/core";



// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SendToSensemakingTask({ setAnswer }: StimulusParams<any>){
  
const answers = useStoreSelector((state) => state.answers);
  console.log("🚀 ~ test ~ answers:", answers)


  const { actions, trrack } = useMemo(() => {
      const reg = Registry.create();
  
      const clickAction = reg.register('click', (state, click:boolean) => {
        state.clicked = click;
        return state;
      });
  
      const trrackInst = initializeTrrack({
        registry: reg,
        initialState: {
          clicked: false,
        },
      });
  
      return {
        actions: {
          clickAction,
        },
        trrack: trrackInst,
      };
  }, []);
  
    const clickCallback = useCallback(() => {
        
      window.open("https://indie.cise.ufl.edu/MaverickMystery/?=5", "_blank");
  
      trrack.apply('Clicked', actions.clickAction(true));
  
      setAnswer({
        status: true,
        provenanceGraph: trrack.graph.backend,
        answers: {
          "clicked": true,
        },
      });
    }, [actions, setAnswer, trrack]);
  return (
      <div>
        <h1>Task</h1>
        <p>Using the tool you just learned about, here is the premise for your investigation.</p>

        <p><em>Please read the following aloud.</em></p>

        <h2>Premise</h2>
        <p>Walter Boddy has been murdered at his estate. The police have named Mr. <strong>HENRY WADSWORTH</strong> as the primary suspect.</p>
        <p>Mr. <strong>WADSWORTH</strong> claims he did not do it and wants your help to solve the mystery and clear his name.</p>
        <p>You have asked a field reporter, Mr. <strong>HANS BRAUMAN</strong>, to collect evidence and track down the truth.</p>
        <p>Your goal is to use the documents to identify:</p>
        <ul>
          <li><strong>Who</strong> committed the murder,</li>
          <li><strong>What</strong> weapon was used, and</li>
          <li><strong>Where</strong> it occurred at the Boddy Estate.</li>
        </ul>
        <p><em>A copy of this premise will be available in the interface.</em></p>

      <h2>Timing and Tools</h2>
        <p>You only have <strong>15 minutes</strong> to look at evidence.</p>
        <p><em>Be mindful about what you focus on.</em> You will <strong>not have enough time</strong> to read all the documents.</p>

        <p>Right click to access the:</p>
        <ol>
          <li>📝 <strong>Note tool</strong> to write down anything of interest,</li>
          <li>🖊️ <strong>Highlight tool</strong> to mark interesting content in <span style={{ backgroundColor: "#77F7A4" }}>Green</span>, and</li>
          <li>🔎 <strong>Search tool</strong> to find documents (matching content will be in <span style={{ backgroundColor: "#ffea57" }}>Yellow</span>).</li>
        </ol>

        <h3>A note about the truth</h3>
        <p>Only those involved in the murder may knowingly lie, while anyone might unknowingly provide false information.</p>

        <p>For example, if a John Doe is guilty of murder and says he never saw the victim that night, he is knowingly lying
          (<strong>1st Degree lie</strong>).</p>

        <p>Now, if Jane Doe, who is innocent, says the victim left at 8 PM, but the victim actually left at 7 PM,
          that's unknowingly providing false information because she wasn't there to see them leave
          (<strong>2nd Degree lie</strong>).</p>

        <p>Only those directly involved with the murder will tell <strong>1st degree lies</strong>. Everyone else could provide
          false information though.</p>

        <h3>Are you ready to begin?</h3>
      <Button
        variant="outline"
        color="green"
        onClick={() => {
          clickCallback(); //use a click callback to trigger the setAnswer function and allow the user to continue after opening the document explorer.
        }}
        >
        Open Document Explorer
      </Button>
        <p>After this task, your interactions will be used to generate a summary of your investigation.</p>
    </div>
  );
}

export default SendToSensemakingTask;
