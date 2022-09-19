import { AppCategories } from "@prisma/client";
import { GetStaticPropsContext, InferGetStaticPropsType } from "next";
import Link from "next/link";
import { useRouter } from "next/router";

import { getAppRegistry } from "@calcom/app-store/_appRegistry";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import prisma from "@calcom/prisma";
import { Icon } from "@calcom/ui/Icon";
import { SkeletonText } from "@calcom/ui/v2";
import Shell from "@calcom/ui/v2/core/Shell";
import AppCard from "@calcom/ui/v2/core/apps/AppCard";

export default function Apps({ apps }: InferGetStaticPropsType<typeof getStaticProps>) {
  const { t, isLocaleReady } = useLocale();
  const router = useRouter();
  const { category } = router.query;

  return (
    <>
      <Shell isPublic large>
        <div className="text-md flex items-center gap-1 px-4 pb-3 pt-3 font-semibold md:px-8 lg:px-0 lg:pt-0">
          <Link href="/apps">
            <a className="inline-flex items-center justify-start gap-1 rounded-sm py-2 text-gray-900">
              <Icon.FiArrowLeft className="h-4 w-4" />
              {isLocaleReady ? t("app_store") : <SkeletonText className="h-4 w-24" />}{" "}
            </a>
          </Link>
          {category && (
            <span className="flex gap-1 text-gray-600">
              <span>&nbsp;/&nbsp;</span>
              {t("category_apps", { category: category[0].toUpperCase() + category?.slice(1) })}
            </span>
          )}
        </div>
        <div className="mb-16">
          <div className="grid-col-1 grid grid-cols-1 gap-3 md:grid-cols-3">
            {apps.map((app) => {
              return <AppCard key={app.slug} app={app} />;
            })}
          </div>
        </div>
      </Shell>
    </>
  );
}

export const getStaticPaths = async () => {
  const appStore = await getAppRegistry();
  const paths = appStore.reduce((categories, app) => {
    if (!categories.includes(app.category)) {
      categories.push(app.category);
    }
    return categories;
  }, [] as string[]);

  return {
    paths: paths.map((category) => ({ params: { category } })),
    fallback: false,
  };
};

export const getStaticProps = async (context: GetStaticPropsContext) => {
  const category = context.params?.category as AppCategories;

  const appQuery = await prisma.app.findMany({
    where: {
      categories: {
        has: category,
      },
    },
    select: {
      slug: true,
    },
  });

  const dbAppsSlugs = appQuery.map((category) => category.slug);

  const appStore = await getAppRegistry();

  const apps = appStore.filter((app) => dbAppsSlugs.includes(app.slug));
  return {
    props: {
      apps,
    },
  };
};
