/*
 *  Copyright 2023 Collate.
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *  http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
import { Checkbox, Col, Row, Typography } from 'antd';
import classNames from 'classnames';
import TitleBreadcrumb from 'components/common/title-breadcrumb/title-breadcrumb.component';
import { EntityHeader } from 'components/Entity/EntityHeader/EntityHeader.component';
import TableDataCardBody from 'components/TableDataCardBody/TableDataCardBody';
import { FQN_SEPARATOR_CHAR } from 'constants/char.constants';
import { EntityType } from 'enums/entity.enum';
import { OwnerType } from 'enums/user.enum';
import { EntityReference } from 'generated/type/entityLineage';
import { isString, startCase, uniqueId } from 'lodash';
import { ExtraInfo } from 'Models';
import React, { forwardRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { getEntityPlaceHolder, getOwnerValue } from 'utils/CommonUtils';
import {
  getEntityBreadcrumbs,
  getEntityId,
  getEntityLinkFromType,
  getEntityName,
} from 'utils/EntityUtils';
import { getEncodedFqn, stringToHTML } from 'utils/StringsUtils';
import { getServiceIcon, getUsagePercentile } from 'utils/TableUtils';
import './explore-search-card.less';
import { ExploreSearchCardProps } from './ExploreSearchCard.interface';

const ExploreSearchCard: React.FC<ExploreSearchCardProps> = forwardRef<
  HTMLDivElement,
  ExploreSearchCardProps
>(
  (
    {
      id,
      className,
      source,
      matches,
      handleSummaryPanelDisplay,
      showCheckboxes,
      checked,
      showTags = true,
      showNameHeader = true,
      openEntityInNewPage,
    },
    ref
  ) => {
    const { t } = useTranslation();
    const { tab } = useParams<{ tab: string }>();

    const otherDetails = useMemo(() => {
      const tierValue = isString(source.tier)
        ? source.tier
        : source.tier?.tagFQN?.split(FQN_SEPARATOR_CHAR)?.[1] ?? '';
      const profileName =
        source.owner?.type === OwnerType.USER ? source.owner?.name : undefined;

      const _otherDetails: ExtraInfo[] = [
        {
          key: 'Owner',
          value: getOwnerValue(source.owner as EntityReference),
          placeholderText: getEntityPlaceHolder(
            getEntityName(source.owner as EntityReference),
            source.owner?.deleted
          ),
          id: getEntityId(source.owner as EntityReference),
          isEntityDetails: true,
          isLink: true,
          openInNewTab: false,
          profileName,
        },
      ];

      if (
        source.entityType !== EntityType.GLOSSARY_TERM &&
        source.entityType !== EntityType.TAG
      ) {
        _otherDetails.push({
          key: 'Tier',
          value: tierValue,
        });
      }

      if ('usageSummary' in source) {
        _otherDetails.push({
          value: getUsagePercentile(
            source.usageSummary?.weeklyStats?.percentileRank ?? 0,
            true
          ),
        });
      }

      return _otherDetails;
    }, [source]);

    const serviceIcon = useMemo(() => {
      return getServiceIcon(source);
    }, [source]);

    const breadcrumbs = useMemo(
      () => getEntityBreadcrumbs(source, source.entityType as EntityType, true),
      [source]
    );

    const header = useMemo(() => {
      return (
        <>
          {showNameHeader ? (
            <Row wrap={false}>
              <Col flex="auto">
                <EntityHeader
                  titleIsLink
                  breadcrumb={breadcrumbs}
                  entityData={source}
                  entityType={source.entityType as EntityType}
                  gutter="large"
                  icon={serviceIcon}
                  openEntityInNewPage={openEntityInNewPage}
                  serviceName={source?.service?.name ?? ''}
                />
              </Col>
              {showCheckboxes && (
                <Col flex="20px">
                  <Checkbox checked={checked} className="m-l-auto" />
                </Col>
              )}
            </Row>
          ) : (
            <Row gutter={[8, 8]}>
              <Col span={24}>
                <div className="d-flex gap-2 items-center">
                  {serviceIcon}
                  <div
                    className="entity-breadcrumb"
                    data-testid="category-name">
                    <TitleBreadcrumb titleLinks={breadcrumbs} />
                  </div>
                </div>
              </Col>
              <Col span={24}>
                <Link
                  className="no-underline"
                  data-testid="entity-link"
                  target={openEntityInNewPage ? '_blank' : '_self'}
                  to={
                    source.fullyQualifiedName && source.entityType
                      ? getEntityLinkFromType(
                          getEncodedFqn(source.fullyQualifiedName),
                          source.entityType as EntityType
                        )
                      : ''
                  }>
                  <Typography.Text
                    className="text-lg font-medium text-link-color"
                    data-testid="entity-header-display-name">
                    {stringToHTML(getEntityName(source))}
                  </Typography.Text>
                </Link>
              </Col>
            </Row>
          )}
        </>
      );
    }, [breadcrumbs, source]);

    return (
      <div
        className={classNames('explore-search-card', className)}
        data-testid="table-data-card"
        id={id}
        ref={ref}
        onClick={() => {
          handleSummaryPanelDisplay?.(source, tab);
        }}>
        {header}

        <div className="p-t-sm">
          <TableDataCardBody
            description={source.description ?? ''}
            extraInfo={otherDetails}
            tags={showTags ? source.tags : []}
          />
        </div>
        {matches && matches.length > 0 ? (
          <div
            className="p-t-sm text-grey-muted text-xs"
            data-testid="matches-stats">
            <span>{`${t('label.matches')}:`}</span>
            {matches.map((data, i) => (
              <span className="m-l-xs" key={uniqueId()}>
                {`${data.value} in ${startCase(data.key)}${
                  i !== matches.length - 1 ? ',' : ''
                }`}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    );
  }
);

export default ExploreSearchCard;
