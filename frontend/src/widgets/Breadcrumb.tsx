import { useMatches, Params, Link, UIMatch } from "react-router-dom";

// breadcrumb 핸들러 타입: 문자열 또는 인자를 받아 문자열을 반환
type BreadcrumbContent = string | ((args: { params: Params }) => string);

export interface Handle {
  breadcrumb: BreadcrumbContent;
}

// breadcrumb 핸들러를 실행해 label 문자열을 반환
function resolveBreadcrumb(
  breadcrumb: BreadcrumbContent,
  params: Params,
): string {
  return typeof breadcrumb === "function" ? breadcrumb({ params }) : breadcrumb;
}

function Breadcrumbs() {
  // 현재 위치에 대응되는 모든 중첩 라우트 객체(UIMatch)의 배열을 반환
  // 예시: /contents/document → ["/", "/contents", "/contents/document"]
  const matches = useMatches() as UIMatch<Handle, Params>[];

  // 매칭된 UIMatch를 label로 매핑
  // breadcrumb 핸들러가 정의된 라우트만 필터링& breadcrumb 라벨과 경로를 매핑
  const crumbs = matches
    .filter((m): m is UIMatch<Handle, Params> & { handle: Handle } =>
      Boolean(m.handle?.breadcrumb),
    )
    .map((m) => ({
      to: m.pathname,
      label: resolveBreadcrumb(m.handle.breadcrumb, m.params),
    }));

  return (
    <nav aria-label="breadcrumb" className="text-sm text-gray-600">
      <ol className="flex space-x-2">
        {crumbs.map((crumb, idx) => {
          const isLast = idx === crumbs.length - 1;
          return (
            <li key={crumb.to} className="flex items-center">
              {!isLast && (
                <Link to={crumb.to} className="hover:underline">
                  {crumb.label}
                </Link>
              )}
              {isLast && <span>{crumb.label}</span>}
              {!isLast && <span className="mx-2">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;
