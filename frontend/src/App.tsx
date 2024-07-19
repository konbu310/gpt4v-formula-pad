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
import type { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions";

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

type Model = ChatCompletionCreateParamsBase["model"];

const models: Model[] = ["gpt-4o", "gpt-4o-mini"];

export const App: FC = () => {
  const [latex, setLatex] = useState<string>("");
  const [base64, setBase64] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [model, setModel] = useState<Model>("gpt-4o");
  const [duration, setDuration] = useState<number>(0);

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
    setDuration(0);
  }, []);

  const onSend = useCallback(async () => {
    const pad = sigPadRef.current;
    if (!pad) return;
    setErrorMsg("");
    setIsLoading(true);
    const data = pad.toDataURL();
    setBase64(data);
    onClear();
    setIsLoading(true);
    setLatex("");
    const res = await fetch("/api/formula", {
      method: "POST",
      body: JSON.stringify({ formula: data, model }),
      headers: { "Content-Type": "application/json" },
    });
    const json = await res.json();
    const latex = json.latex;
    if (latex.startsWith("ERROR:")) {
      setErrorMsg(latex.slice(6));
      setLatex("");
    } else {
      setLatex(json.latex);
    }
    setIsLoading(false);
  }, [model, onClear]);

  const onResend = useCallback(async () => {
    if (!base64) return;
    onClear();
    setIsLoading(true);
    setLatex("");
    const res = await fetch("/api/formula", {
      method: "POST",
      body: JSON.stringify({ formula: base64, model }),
      headers: { "Content-Type": "application/json" },
    });
    const json = await res.json();
    const latex = json.latex;
    if (latex.startsWith("ERROR:")) {
      setErrorMsg(latex.slice(6));
      setLatex("");
    } else {
      setLatex(json.latex);
    }
    setIsLoading(false);
  }, [base64, model, onClear]);

  useEffect(() => {
    if (canvasRef.current) {
      sigPadRef.current = new SignaturePad(canvasRef.current, {
        backgroundColor: "white",
      });
    }
  }, []);

  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (!entry.name.includes("api/formula")) return;
        if (!("duration" in entry)) return;
        const duration = entry.duration;
        if (duration > 0) {
          setDuration(duration);
        }
      });
    });

    observer.observe({ type: "resource", buffered: true });

    return () => {
      observer.disconnect();
    };
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

          <select
            value={model}
            onChange={(ev) => setModel(ev.currentTarget.value)}
            style={{ padding: "0.5rem", cursor: "pointer" }}
          >
            {models.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
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
          <div
            style={{
              display: "flex",
              gap: "1rem",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h2>Preview</h2>

            <button
              disabled={!base64}
              style={{ height: "fit-content" }}
              onClick={onResend}
            >
              Re-send
            </button>
          </div>

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
          <div
            style={{
              display: "flex",
              gap: "1rem",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h2>Result</h2>

            {duration > 0 && <p>{Math.trunc(duration) / 1000} s</p>}
          </div>

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

            {errorMsg !== "" && <p style={{ color: "red" }}>{errorMsg}</p>}

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
