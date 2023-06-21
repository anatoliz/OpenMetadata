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
import { Col, Divider, Row, Typography } from 'antd';
import { EntityUnion } from 'components/Explore/explore.interface';
import TagsViewer from 'components/Tag/TagsViewer/tags-viewer';
import { TagLabel } from 'generated/type/tagLabel';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ReactComponent as TagIcon } from '../../../assets/svg/tag-grey.svg';
import RichTextEditorPreviewer from '../rich-text-editor/RichTextEditorPreviewer';

const SummaryTagsDescription = ({
  tags,
  entityDetail,
}: {
  tags: TagLabel[];
  entityDetail: EntityUnion;
}) => {
  const { t } = useTranslation();

  return (
    <>
      <Row className="m-md" gutter={[0, 16]}>
        <Col span={24}>
          <Typography.Text className="summary-panel-section-title">
            {t('label.tag-plural')}
          </Typography.Text>
        </Col>
        <Col span={24}>
          {tags.length > 0 ? (
            <Row>
              <Col span={1}>
                <TagIcon
                  className="m-t-xs"
                  data-testid="tag-grey-icon"
                  height={14}
                  width={14}
                />
              </Col>
              <Col span={23}>
                <TagsViewer sizeCap={-1} tags={tags} />
              </Col>
            </Row>
          ) : (
            <Typography.Text className="text-grey-body">
              {t('label.no-tags-added')}
            </Typography.Text>
          )}
        </Col>
      </Row>

      <Divider className="m-y-xs" />

      <Row className="m-md" gutter={[0, 16]}>
        <Col span={24}>
          <Typography.Text
            className="summary-panel-section-title"
            data-testid="schema-header">
            {t('label.description')}
          </Typography.Text>
        </Col>
        <Col span={24}>
          <div>
            {entityDetail.description?.trim() ? (
              <RichTextEditorPreviewer markdown={entityDetail.description} />
            ) : (
              <Typography className="text-grey-body">
                {t('label.no-data-found')}
              </Typography>
            )}
          </div>
        </Col>
      </Row>
    </>
  );
};

export default SummaryTagsDescription;
