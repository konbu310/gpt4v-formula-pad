import {
  DetailedHTMLProps,
  FC,
  HTMLAttributes,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { MathfieldElement } from "mathlive";
import SignaturePad from "signature_pad";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "math-field": DetailedHTMLProps<
        HTMLAttributes<MathfieldElement>,
        MathfieldElement
      >;
    }
  }
}

export const App: FC = () => {
  const [latex, setLatex] = useState<string>("");
  const [base64, setBase64] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sigPadRef = useRef<SignaturePad | null>(null);

  const onUndo = useCallback(() => {
    const pad = sigPadRef.current;
    if (!pad) return;
    const data = pad.toData();
    if (data) {
      data.pop();
      pad.fromData(data);
    }
  }, []);

  const onClear = useCallback(() => {
    const pad = sigPadRef.current;
    if (!pad) return;
    pad.clear();
  }, []);

  const onSend = useCallback(async () => {
    const pad = sigPadRef.current;
    if (!pad) return;
    setIsLoading(true);
    const data = pad.toDataURL();
    setBase64(data);
    onClear();
    setIsLoading(true);
    setLatex("");
    const res = await fetch("/api/formula", {
      method: "POST",
      body: JSON.stringify({ formula: data }),
      headers: { "Content-Type": "application/json" },
    });
    const json = await res.json();
    setLatex(json.latex);
    setIsLoading(false);
  }, [onClear]);

  useEffect(() => {
    if (canvasRef.current) {
      sigPadRef.current = new SignaturePad(canvasRef.current, {
        backgroundColor: "white",
      });
    }
  }, []);

  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        width: "100vw",
      }}
    >
      <div>
        <h2>Formula Pad</h2>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <button onClick={onClear}>Clear</button>
          <button onClick={onUndo}>Undo</button>
          <button onClick={onSend}>Send</button>
        </div>

        <canvas
          ref={canvasRef}
          width="800"
          height="600"
          style={{
            border: "2px solid lightgray",
            borderRadius: "8px",
          }}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "1em",
        }}
      >
        <div>
          <h2>Preview</h2>

          {base64 ? (
            <img
              src={base64}
              alt=""
              width="400"
              height="300"
              style={{
                border: "2px solid lightgray",
                borderRadius: "8px",
                outline: "none",
              }}
            />
          ) : (
            <div
              style={{
                width: "400px",
                height: "300px",
                border: "2px solid lightgray",
                borderRadius: "8px",
              }}
            ></div>
          )}
        </div>

        <div>
          <h2>Result</h2>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "400px",
              height: "300px",
              border: "2px solid lightgray",
              borderRadius: "8px",
            }}
          >
            <pre>{latex}</pre>
            {isLoading ? (
              <div className="loader" />
            ) : latex !== "" ? (
              <math-field
                style={{
                  minWidth: 300,
                  fontSize: "2em",
                  padding: "1em 0.1em 1em 0.5em",
                }}
              >
                {latex}
              </math-field>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
