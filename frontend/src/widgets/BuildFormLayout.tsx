import { Outlet, useMatches, UIMatch, Params } from 'react-router-dom';

const BuildFormLayout = () => {
  const matches = useMatches() as UIMatch<any, Params>[];
  console.log(matches[matches.length - 1]);
  console.log(matches);

  // UIMatch<any, Params> 타입인 matches 배열에서 handle.buildStep이 있으면서 route depth가 가장 깊은 항목 찾기
  const currentMatch = [...matches]
    .reverse()
    .find((m: UIMatch<any, Params>) => m.handle?.title !== undefined);
  const currentStep = currentMatch?.handle!.buildStep ?? 0;

  console.log(currentMatch);
  const totalSteps = 3;
  const allSteps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <div>
      <header className="mb-4">
        <div className="align-center flex items-center gap-10">
          <span className="text-xl font-semibold text-gray-500">{currentMatch?.handle!.title}</span>
          <hr className="h-px flex-1 bg-gray-200" />
          <div className="flex gap-6">
            {allSteps.map((step: number) => (
              <div
                key={step}
                className={`step-indicator step-${step} ${
                  step === currentStep ? 'font-bold text-blue-600' : 'text-gray-400'
                } `}
              >
                {step}
              </div>
            ))}
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default BuildFormLayout;
