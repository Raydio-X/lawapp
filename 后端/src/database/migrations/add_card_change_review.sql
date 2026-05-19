-- 卡片变更审核功能迁移脚本
-- 为公开知识库中的卡片变更添加审核机制

-- 创建卡片变更审核表
CREATE TABLE IF NOT EXISTS card_change_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    card_id INT NULL COMMENT '卡片ID，新建时为NULL',
    library_id INT NOT NULL COMMENT '知识库ID',
    chapter_id INT NULL COMMENT '章节ID',
    change_type VARCHAR(20) NOT NULL COMMENT '变更类型: create-新建, update-修改',
    old_question TEXT NULL COMMENT '原问题内容',
    old_answer TEXT NULL COMMENT '原答案内容',
    old_tags JSON NULL COMMENT '原标签',
    new_question TEXT NOT NULL COMMENT '新问题内容',
    new_answer TEXT NOT NULL COMMENT '新答案内容',
    new_tags JSON NULL COMMENT '新标签',
    status VARCHAR(20) DEFAULT 'pending' COMMENT '审核状态: pending-待审核, approved-审核通过, rejected-审核驳回',
    review_note TEXT NULL COMMENT '审核意见/驳回原因',
    reviewed_by INT NULL COMMENT '审核人ID',
    reviewed_at DATETIME NULL COMMENT '审核时间',
    created_by INT NOT NULL COMMENT '提交人ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_card_id (card_id),
    INDEX idx_library_id (library_id),
    INDEX idx_status (status),
    INDEX idx_created_by (created_by),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE SET NULL,
    FOREIGN KEY (library_id) REFERENCES libraries(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='卡片变更审核表';

-- 为卡片表添加审核相关字段
ALTER TABLE cards 
ADD COLUMN has_pending_change TINYINT DEFAULT 0 COMMENT '是否有待审核的变更';

-- 添加索引
CREATE INDEX idx_has_pending_change ON cards(has_pending_change);
