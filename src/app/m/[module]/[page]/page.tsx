import type { Metadata } from "next";
import { resolveMenu } from "@/lib/menu";
import { getListSchema } from "@/lib/listSchema";
import PermissionGuard from "@/components/PermissionGuard";
import ListPage from "@/components/ListPage";

type Params = { module: string; page: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { module, page } = await params;
  const found = resolveMenu(decodeURIComponent(module), decodeURIComponent(page));
  return {
    title: found
      ? `${found.page.label} - ${found.module.label} - 开元数智`
      : "开元数智 - 企业管理",
  };
}

export default async function ModulePage({ params }: { params: Promise<Params> }) {
  const { module, page } = await params;
  const moduleLabel = decodeURIComponent(module);
  const pageLabel = decodeURIComponent(page);
  const found = resolveMenu(moduleLabel, pageLabel);
  const schema = getListSchema(moduleLabel, pageLabel);
  const siblings = (found?.siblings ?? []).map((s) => s.label);

  return (
    <PermissionGuard module={moduleLabel} page={pageLabel}>
      <ListPage
        moduleLabel={moduleLabel}
        pageLabel={pageLabel}
        schema={schema}
        siblings={siblings}
      />
    </PermissionGuard>
  );
}
